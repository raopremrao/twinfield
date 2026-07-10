import numpy as np
from copy import copy

try:
    from sequence.kernel.event import Event
    from sequence.kernel.process import Process
    from sequence.kernel.timeline import Timeline
    from sequence.constants import FOCK_DENSITY_MATRIX_FORMALISM
    from sequence.components.detector import QSDetectorFockDirect, QSDetectorFockInterference
    from sequence.components.light_source import SPDCSource
    from sequence.components.memory import AbsorptiveMemory
    from sequence.components.optical_channel import QuantumChannel
    from sequence.components.photon import Photon
    from sequence.topology.node import Node
    from sequence.protocol import Protocol
    from sequence.kernel.quantum_utils import measure_multiple_with_cache_fock_density, density_partial_trace
except ImportError:
    pass

# Constants for Hardware Simulation
TRUNCATION = 2
TELECOM_WAVELENGTH = 1436
WAVELENGTH = 606
SPDC_FREQUENCY = 80e6
MEAN_PHOTON_NUM = 0.1

BSM_DET_EFFICIENCY = 0.6
BSM_DET_DARK = 150
MEAS_DET_EFFICIENCY = 0.6
MEAS_DET_DARK = 150

MODE_NUM = 100
MEMO_FREQUENCY = SPDC_FREQUENCY
ABS_EFFICIENCY = 0.35
DECAY_RATE = 4.3e-8

def efficiency(t: int) -> float:
    return np.exp(-t*DECAY_RATE)

def build_bell_state(truncation, sign, phase=0, formalism="dm"):
    basis0 = np.zeros(truncation+1)
    basis0[0] = 1
    basis1 = np.zeros(truncation+1)
    basis1[1] = 1
    basis10 = np.kron(basis1, basis0)
    basis01 = np.kron(basis0, basis1)
    
    if sign == "plus":
        ket = (basis10 + np.exp(1j*phase)*basis01)/np.sqrt(2)
    elif sign == "minus":
        ket = (basis10 - np.exp(1j*phase)*basis01)/np.sqrt(2)
    
    if formalism == "dm":
        return np.outer(ket, ket.conj())
    return ket

def add_channel(node1, node2_name, timeline, distance, attenuation):
    name = f"qc_{node1.name}_{node2_name}"
    qc = QuantumChannel(name, timeline, distance=distance, attenuation=attenuation)
    qc.set_ends(node1, node2_name)
    return qc

class EmitProtocol(Protocol):
    def __init__(self, owner, name, other_node, photon_pair_num, source_name, memory_name):
        super().__init__(owner, name)
        self.other_node = other_node
        self.num_output = photon_pair_num
        self.source_name = source_name
        self.memory_name = memory_name

    def start(self):
        if not self.owner.components[self.memory_name].is_prepared:
            self.owner.components[self.memory_name]._prepare_AFC()
        states = [None] * self.num_output
        source = self.owner.components[self.source_name]
        source.emit(states)

    def received_message(self, src: str, msg):
        pass

class EndNode(Node):
    def __init__(self, name, timeline, other_node, bsm_node, measure_node, mean_photon_num, eavesdropper_active=False):
        super().__init__(name, timeline)
        self.bsm_name = bsm_node
        self.meas_name = measure_node
        self.spdc_name = name + ".spdc_source"
        self.memo_name = name + ".memory"
        
        # Eavesdropper slightly degrades memory efficiency
        eff = ABS_EFFICIENCY * 0.7 if eavesdropper_active else ABS_EFFICIENCY
        
        spdc = SPDCSource(self.spdc_name, timeline, wavelengths=[TELECOM_WAVELENGTH, WAVELENGTH],
                          frequency=SPDC_FREQUENCY, mean_photon_num=mean_photon_num)
        memory = AbsorptiveMemory(self.memo_name, timeline, frequency=MEMO_FREQUENCY,
                                  absorption_efficiency=eff, afc_efficiency=efficiency,
                                  mode_number=MODE_NUM, wavelength=WAVELENGTH, destination=measure_node)
        self.add_component(spdc)
        self.add_component(memory)
        spdc.add_receiver(self)
        spdc.add_receiver(memory)
        memory.add_receiver(self)
        self.emit_protocol = EmitProtocol(self, name + ".emit_protocol", other_node, MODE_NUM, self.spdc_name, self.memo_name)

    def get(self, photon, **kwargs):
        dst = kwargs.get("dst")
        if dst is None:
            self.send_qubit(self.bsm_name, photon)
        else:
            self.send_qubit(dst, photon)

class EntangleNode(Node):
    def __init__(self, name, timeline, src_list):
        super().__init__(name, timeline)
        self.bsm_name = name + ".bsm"
        bsm = QSDetectorFockInterference(self.bsm_name, timeline, src_list)
        self.add_component(bsm)
        bsm.attach(self)
        self.set_first_component(self.bsm_name)
        self.resolution = max([d.time_resolution for d in bsm.detectors])
        bsm.set_detector(0, efficiency=BSM_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=BSM_DET_DARK)
        bsm.set_detector(1, efficiency=BSM_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=BSM_DET_DARK)

    def receive_qubit(self, src: str, qubit):
        self.components[self.first_component_name].get(qubit, src=src)

class MeasureNode(Node):
    def __init__(self, name, timeline, other_nodes):
        super().__init__(name, timeline)
        self.direct_detector_name = name + ".direct"
        direct_detector = QSDetectorFockDirect(self.direct_detector_name, timeline, other_nodes)
        self.add_component(direct_detector)
        direct_detector.attach(self)
        self.bs_detector_name = name + ".bs"
        bs_detector = QSDetectorFockInterference(self.bs_detector_name, timeline, other_nodes)
        self.add_component(bs_detector)
        bs_detector.add_receiver(self)
        self.set_first_component(self.direct_detector_name)
        self.resolution = max([d.time_resolution for d in direct_detector.detectors + bs_detector.detectors])
        direct_detector.set_detector(0, efficiency=MEAS_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=MEAS_DET_DARK)
        direct_detector.set_detector(1, efficiency=MEAS_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=MEAS_DET_DARK)
        bs_detector.set_detector(0, efficiency=MEAS_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=MEAS_DET_DARK)
        bs_detector.set_detector(1, efficiency=MEAS_DET_EFFICIENCY, count_rate=SPDC_FREQUENCY, dark_count=MEAS_DET_DARK)

    def receive_qubit(self, src: str, qubit):
        self.components[self.first_component_name].get(qubit, src=src)
