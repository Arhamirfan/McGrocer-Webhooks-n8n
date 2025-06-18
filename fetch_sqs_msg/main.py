import os
from dotenv import load_dotenv
import boto3
import json
from datetime import datetime
import time

load_dotenv()  # Load env vars from .env

QUEUE_URL = os.getenv("QUEUE_URL")
OUTPUT_DIR = "output"

sqs = boto3.client(
    "sqs",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_DEFAULT_REGION")
)

def receive_and_save_message():
    response = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=10,
        VisibilityTimeout=20
    )

    messages = response.get("Messages", [])
    if not messages:
        print("No messages available.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"messages length: {len(messages)}")
    i=0

    for msg in messages:
        receipt_handle = msg["ReceiptHandle"]
        body = msg["Body"]
        # print(f"{i}: {body}")
        i+=1
        try:
            data = json.loads(body)
            filename = f'{data.get("id", "message")}_{datetime.now().strftime("%Y%m%d%H%M%S")}.json'
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            time.sleep(1)
            print(f"Saved: {filepath}")

            # sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
            # print("Message deleted.")

        except json.JSONDecodeError:
            print("Invalid JSON format.")

if __name__ == "__main__":
    receive_and_save_message()
