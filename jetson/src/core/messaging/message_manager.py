import json
import logging
import os
import requests
from typing import Dict, Any, Callable, Optional
from threading import Thread, Event
from confluent_kafka import Producer, Consumer, KafkaError
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
dotenv_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path)

class MessageManager:
    """
    Message manager class for handling messaging via Kafka or HTTP API
    """
    
    # Default Kafka configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    KAFKA_ATTENDANCE_TOPIC = os.getenv('KAFKA_ATTENDANCE_TOPIC', 'attendance_events')
    KAFKA_SYSTEM_TOPIC = os.getenv('KAFKA_SYSTEM_TOPIC', 'system_events')
    KAFKA_GROUP_ID = os.getenv('KAFKA_GROUP_ID', 'face_recognition_group')
    
    # API configuration
    API_ENDPOINT = os.getenv('API_CHECK_ATTENDANCE', '')
    API_TOKEN = os.getenv('ACCESS_TOKEN', '')
    
    def __init__(self, use_kafka=False, use_api=True):
        """
        Initialize Message Manager
        
        Args:
            use_kafka: Whether to use Kafka for messaging
            use_api: Whether to use HTTP API for messaging
        """
        self.logger = logging.getLogger("MessageManager")
        self.consumer_thread = None
        self.stop_event = Event()
        
        # Set message sending method
        self.use_kafka = use_kafka
        self.use_api = use_api
        
        if not self.use_kafka and not self.use_api:
            self.logger.warning("Both Kafka and API are disabled. Messages will only be logged.")
        
        # Log configuration
        self.logger.info(f"Message Manager initialized with: Kafka={use_kafka}, API={use_api}")
        
        # Configure Kafka producer
        self.producer_config = {
            'bootstrap.servers': self.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': f'face_recognition_producer_{os.getpid()}',
            'acks': 'all'
        }
        
        # Configure Kafka consumer
        self.consumer_config = {
            'bootstrap.servers': self.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': self.KAFKA_GROUP_ID,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
        
        # Initialize producer if using Kafka
        if self.use_kafka:
            self._initialize_kafka_producer()
        else:
            self.producer = None
            self.logger.info("Kafka producer disabled")
    
    def _initialize_kafka_producer(self):
        """Initialize Kafka producer"""
        try:
            self.producer = Producer(self.producer_config)
            self.logger.info(f"Kafka producer initialized with servers: {self.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as e:
            self.logger.error(f"Failed to initialize Kafka producer: {e}")
            self.producer = None
            self.use_kafka = False
    
    def send_attendance_event(self, attendance_data: Dict[str, Any]) -> bool:
        """
        Send attendance data via configured channels (Kafka and/or API)
        
        Args:
            attendance_data: Dictionary containing attendance information
            
        Returns:
            bool: Success status
        """
        success = True
        
        # Always log the data
        self.logger.info(f"ATTENDANCE DATA: {json.dumps(attendance_data)}")
        
        # Send via Kafka if enabled
        if self.use_kafka and self.producer:
            try:
                kafka_success = self._send_message(self.KAFKA_ATTENDANCE_TOPIC, attendance_data)
                if not kafka_success:
                    self.logger.warning("Failed to send attendance data to Kafka")
                    success = False
            except Exception as e:
                self.logger.error(f"Error sending to Kafka: {e}")
                success = False
        
        # Send via API if enabled
        if self.use_api:
            try:
                api_success = self._send_via_api(attendance_data)
                if not api_success:
                    self.logger.warning("Failed to send attendance data via API")
                    success = False
            except Exception as e:
                self.logger.error(f"Error sending via API: {e}")
                success = False
        
        return success
    
    def send_system_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Send system event via configured channels
        
        Args:
            event_data: Dictionary containing system event information
            
        Returns:
            bool: Success status
        """
        # Always log the data
        self.logger.info(f"SYSTEM EVENT: {json.dumps(event_data)}")
        
        # Only send system events to Kafka, not to API
        if self.use_kafka and self.producer:
            return self._send_message(self.KAFKA_SYSTEM_TOPIC, event_data)
        
        return True
    
    def _send_message(self, topic: str, data: Dict[str, Any]) -> bool:
        """
        Send message to Kafka topic
        
        Args:
            topic: Kafka topic
            data: Message data
            
        Returns:
            bool: Success status
        """
        if not self.producer:
            self.logger.warning("Kafka producer not available")
            return False
        
        try:
            # Convert data to JSON string
            message_value = json.dumps(data).encode('utf-8')
            
            # Send message
            self.producer.produce(topic, value=message_value)
            self.producer.flush(timeout=5)
            self.logger.info(f"Sent message to Kafka topic: {topic}")
            return True
        except Exception as e:
            self.logger.error(f"Error sending message to Kafka: {e}")
            return False
    
    def _send_via_api(self, data: Dict[str, Any]) -> bool:
        """
        Send data via HTTP API
        
        Args:
            data: Data to send
            
        Returns:
            bool: Success status
        """
        if not self.API_ENDPOINT:
            self.logger.warning("API endpoint not configured")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.API_TOKEN}',
                'Content-Type': 'application/json'
            }
            
            # Send using PUT request
            response = requests.put(
                self.API_ENDPOINT,
                headers=headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.info(f"Successfully sent data to API: {self.API_ENDPOINT}")
                return True
            else:
                self.logger.error(f"API request failed with status code: {response.status_code}")
                try:
                    error_data = response.json()
                    self.logger.error(f"API error response: {json.dumps(error_data)}")
                except:
                    self.logger.error(f"API response: {response.text}")
                return False
        except Exception as e:
            self.logger.error(f"Error sending data to API: {e}")
            return False
    
    def start_consumer(self, topic: str, message_handler: Callable[[Dict[str, Any]], None]):
        """
        Start Kafka consumer in a background thread
        
        Args:
            topic: Kafka topic to consume
            message_handler: Callback function to handle received messages
        """
        if not self.use_kafka:
            self.logger.warning("Kafka is disabled. Cannot start consumer.")
            return
            
        if self.consumer_thread and self.consumer_thread.is_alive():
            self.logger.warning("Consumer already running")
            return
        
        self.stop_event.clear()
        self.consumer_thread = Thread(
            target=self._consume_messages,
            args=(topic, message_handler),
            daemon=True
        )
        self.consumer_thread.start()
        self.logger.info(f"Started consumer for topic: {topic}")
    
    def stop_consumer(self):
        """Stop Kafka consumer"""
        if self.consumer_thread and self.consumer_thread.is_alive():
            self.stop_event.set()
            self.consumer_thread.join(timeout=5.0)
            self.logger.info("Stopped Kafka consumer")
    
    def _consume_messages(self, topic: str, message_handler: Callable[[Dict[str, Any]], None]):
        """
        Consume messages from Kafka topic
        
        Args:
            topic: Kafka topic to consume
            message_handler: Callback function to handle received messages
        """
        try:
            # Create consumer
            consumer = Consumer(self.consumer_config)
            
            # Subscribe to topic
            consumer.subscribe([topic])
            
            # Process messages
            while not self.stop_event.is_set():
                msg = consumer.poll(1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition event - not an error
                        continue
                    else:
                        self.logger.error(f"Consumer error: {msg.error()}")
                        break
                
                try:
                    # Parse message
                    message_value = msg.value().decode('utf-8')
                    message_data = json.loads(message_value)
                    
                    # Handle message
                    message_handler(message_data)
                except Exception as e:
                    self.logger.error(f"Error processing message: {str(e)}")
            
            # Close consumer
            consumer.close()
            
        except Exception as e:
            self.logger.error(f"Consumer error: {str(e)}")
    
    def close(self):
        """Close connections"""
        self.stop_consumer()
        if self.producer:
            self.producer.flush()

    def send_attendance(self, attendance_data):
        """
        Gửi dữ liệu điểm danh qua API
        
        Args:
            attendance_data: Dict dữ liệu điểm danh
            
        Returns:
            dict: Kết quả từ API
        """
        if not self.use_api:
            return {"success": False, "message": "API is disabled", "code": "API_DISABLED"}
        
        try:
            import requests
            import json
            import traceback
            from datetime import datetime
            
            # Chuẩn bị headers
            headers = {
                "Content-Type": "application/json",
                "x-device-id": str(attendance_data.get("deviceId", 1))
            }
            
            # API URL từ config
            api_url = self.config.api.attendance_url
            
            # Log API request
            print(f"Sending attendance data to API: {api_url}")
            
            # Gửi request
            try:
                response = requests.post(
                    api_url,
                    json=attendance_data,
                    headers=headers,
                    timeout=10  # 10 seconds timeout
                )
                
                print(f"API request status code: {response.status_code}")
                
                # Parse response
                try:
                    response_data = response.json()
                except Exception:
                    response_data = {
                        "success": False,
                        "message": "Invalid JSON response from server",
                        "code": "INVALID_RESPONSE"
                    }
                
                # Kiểm tra lỗi
                if response.status_code != 200:
                    error_message = response_data.get("message", "Unknown error")
                    error_details = response_data.get("error", "Server error")
                    error_code = response_data.get("code", "SERVER_ERROR")
                    
                    print(f"API error response: {json.dumps(response_data)}")
                    
                    # Phân loại lỗi chi tiết
                    if "không tìm thấy lịch học" in error_details.lower() or "không tìm thấy bản ghi điểm danh" in error_details.lower():
                        error_code = "NO_SCHEDULE"
                        detailed_message = "Không tìm thấy lịch học phù hợp với thời gian hiện tại"
                    elif response.status_code >= 500:
                        error_code = "SERVER_ERROR"
                        detailed_message = "Lỗi máy chủ: không thể xử lý yêu cầu"
                    else:
                        error_code = error_code or "API_ERROR"
                        detailed_message = error_details or error_message
                    
                    return {
                        "success": False,
                        "message": error_message,
                        "error": detailed_message,
                        "code": error_code
                    }
                
                return response_data
                
            except requests.RequestException as e:
                print(f"API request error: {e}")
                traceback.print_exc()
                
                # Phân loại lỗi mạng
                if "ConnectTimeout" in str(e) or "ConnectionError" in str(e):
                    error_code = "NETWORK_ERROR"
                    error_message = "Không thể kết nối đến máy chủ"
                else:
                    error_code = "REQUEST_ERROR"
                    error_message = str(e)
                
                return {
                    "success": False,
                    "message": "Network error connecting to server",
                    "error": error_message,
                    "code": error_code
                }
                
        except Exception as e:
            print(f"Error in send_attendance: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "message": "Internal error processing request",
                "error": str(e),
                "code": "INTERNAL_ERROR"
            } 