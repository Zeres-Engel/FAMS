import json
import logging
import os
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
    Message manager class for handling Kafka messaging
    """
    
    # Default Kafka configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    KAFKA_ATTENDANCE_TOPIC = os.getenv('KAFKA_ATTENDANCE_TOPIC', 'attendance_events')
    KAFKA_SYSTEM_TOPIC = os.getenv('KAFKA_SYSTEM_TOPIC', 'system_events')
    KAFKA_GROUP_ID = os.getenv('KAFKA_GROUP_ID', 'face_recognition_group')
    
    def __init__(self):
        self.logger = logging.getLogger("MessageManager")
        self.consumer_thread = None
        self.stop_event = Event()
        
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
        
        # Initialize producer
        self._initialize_producer()
    
    def _initialize_producer(self):
        """Initialize Kafka producer"""
        try:
            self.producer = Producer(self.producer_config)
            self.logger.info("Kafka producer initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Kafka producer: {str(e)}")
            self.producer = None
    
    def send_attendance_event(self, attendance_data: Dict[str, Any]) -> bool:
        """
        Send attendance data to Kafka
        
        Args:
            attendance_data: Dictionary containing attendance information
            
        Returns:
            bool: True if message was sent successfully
        """
        return self._send_message(self.KAFKA_ATTENDANCE_TOPIC, attendance_data)
    
    def send_system_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Send system event to Kafka
        
        Args:
            event_data: Dictionary containing system event information
            
        Returns:
            bool: True if message was sent successfully
        """
        return self._send_message(self.KAFKA_SYSTEM_TOPIC, event_data)
    
    def _send_message(self, topic: str, data: Dict[str, Any]) -> bool:
        """
        Send message to Kafka topic
        
        Args:
            topic: Kafka topic
            data: Message data
            
        Returns:
            bool: True if message was sent successfully
        """
        if self.producer is None:
            self._initialize_producer()
            if self.producer is None:
                self.logger.error(f"Failed to send message to topic {topic}: Producer not available")
                return False
        
        try:
            # Convert data to JSON string
            message = json.dumps(data).encode('utf-8')
            
            # Send message
            self.producer.produce(
                topic=topic,
                value=message,
                callback=self._delivery_callback
            )
            
            # Flush to ensure delivery
            self.producer.flush()
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to send message to topic {topic}: {str(e)}")
            return False
    
    def _delivery_callback(self, err, msg):
        """Callback function for message delivery"""
        if err:
            self.logger.error(f"Message delivery failed: {err}")
        else:
            self.logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")
    
    def start_consumer(self, topic: str, message_handler: Callable[[Dict[str, Any]], None]):
        """
        Start Kafka consumer in a background thread
        
        Args:
            topic: Kafka topic to consume
            message_handler: Callback function to handle received messages
        """
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
        """Close Kafka connections"""
        self.stop_consumer()
        if self.producer:
            self.producer.flush()
            # Producer doesn't have a close method in confluent_kafka 