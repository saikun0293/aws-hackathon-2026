"""
Bulk Ingestion Script for All Reviews
Automatically handles pagination to process all 10,000+ reviews with embeddings.

This script invokes the IngestionLambda function multiple times with pagination
to process all reviews from DynamoDB and index them to OpenSearch with embeddings.

Usage:
    python bulk_ingest_all.py

Requirements:
    - AWS credentials configured (AWS CLI or environment variables)
    - boto3 installed: pip install boto3
"""

import boto3
import json
import time
from datetime import datetime

# Configuration
LAMBDA_FUNCTION_NAME = 'IngestionLambda'
BATCH_SIZE = 25  # Process 25 reviews per Lambda invocation (safe for timeout)
AWS_REGION = 'us-east-1'  # Your Lambda region

# Initialize Lambda client
lambda_client = boto3.client('lambda', region_name=AWS_REGION)

def invoke_lambda_batch(last_evaluated_key=None):
    """
    Invoke Lambda function to process one batch of reviews.
    
    Args:
        last_evaluated_key: Pagination key from previous batch
        
    Returns:
        Response from Lambda function
    """
    # Prepare event payload
    event = {
        'mode': 'batch',
        'batchSize': BATCH_SIZE
    }
    
    if last_evaluated_key:
        event['lastEvaluatedKey'] = last_evaluated_key
    
    # Invoke Lambda
    response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION_NAME,
        InvocationType='RequestResponse',  # Synchronous invocation
        Payload=json.dumps(event)
    )
    
    # Parse response
    response_payload = json.loads(response['Payload'].read())
    
    return response_payload


def main():
    """Main function to process all reviews with pagination."""
    print("=" * 60)
    print("BULK INGESTION - Processing All Reviews with Embeddings")
    print("=" * 60)
    print(f"Lambda Function: {LAMBDA_FUNCTION_NAME}")
    print(f"Batch Size: {BATCH_SIZE} reviews per invocation")
    print(f"Region: {AWS_REGION}")
    print("=" * 60)
    print()
    
    total_processed = 0
    total_indexed = 0
    total_errors = 0
    batch_number = 0
    last_evaluated_key = None
    start_time = time.time()
    
    try:
        while True:
            batch_number += 1
            batch_start_time = time.time()
            
            print(f"[Batch {batch_number}] Invoking Lambda...")
            
            # Invoke Lambda for this batch
            response = invoke_lambda_batch(last_evaluated_key)
            
            # Check if Lambda invocation was successful
            if response.get('statusCode') != 200:
                print(f"[Batch {batch_number}] ERROR: Lambda returned status {response.get('statusCode')}")
                print(f"Response: {json.dumps(response, indent=2)}")
                break
            
            # Parse response body
            body = json.loads(response.get('body', '{}'))
            
            if not body.get('success'):
                print(f"[Batch {batch_number}] ERROR: {body.get('error', 'Unknown error')}")
                break
            
            # Update counters
            processed = body.get('processed', 0)
            indexed = body.get('indexed', 0)
            errors = body.get('errors', 0)
            
            total_processed += processed
            total_indexed += indexed
            total_errors += errors
            
            batch_duration = time.time() - batch_start_time
            
            # Print batch results
            print(f"[Batch {batch_number}] Completed in {batch_duration:.2f}s")
            print(f"  - Processed: {processed}")
            print(f"  - Indexed: {indexed}")
            print(f"  - Errors: {errors}")
            print(f"  - Total so far: {total_indexed} indexed, {total_errors} errors")
            print()
            
            # Check if there are more reviews to process
            last_evaluated_key = body.get('lastEvaluatedKey')
            
            if not last_evaluated_key:
                print("✓ All reviews processed!")
                break
            
            # Small delay to avoid throttling
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
    except Exception as e:
        print(f"\n\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Print final summary
    total_duration = time.time() - start_time
    print()
    print("=" * 60)
    print("INGESTION SUMMARY")
    print("=" * 60)
    print(f"Total Batches: {batch_number}")
    print(f"Total Processed: {total_processed}")
    print(f"Total Indexed: {total_indexed}")
    print(f"Total Errors: {total_errors}")
    print(f"Total Duration: {total_duration:.2f}s ({total_duration/60:.2f} minutes)")
    if total_indexed > 0:
        print(f"Average Time per Review: {total_duration/total_indexed:.2f}s")
    print("=" * 60)
    
    if total_errors > 0:
        print(f"\n⚠ Warning: {total_errors} reviews failed to index")
    else:
        print("\n✓ All reviews successfully indexed with embeddings!")


if __name__ == '__main__':
    main()
