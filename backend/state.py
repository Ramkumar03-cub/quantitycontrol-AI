from simulator import SensorSimulator
from cv_engine import CVEngine
from decision_engine import DecisionEngine
from ai_engine import AIEngine
from dataset_manager import DatasetManager
from history_manager import HistoryManager

sensor_sim = SensorSimulator()
cv_engine = CVEngine()
decision_engine = DecisionEngine()
ai_engine = AIEngine()
dataset_manager = DatasetManager()
history_manager = HistoryManager()

latest_vision_detections = []
