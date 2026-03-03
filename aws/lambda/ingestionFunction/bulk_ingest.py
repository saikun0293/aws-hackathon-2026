#!/usr/bin/env python3
"""
Bulk ingestion script for loading all DynamoDB reviews into OpenSearch with embeddings.

This script invokes the Lambda function in batches to process all 10,000+ reviews.
Each review is enriched with Hospital, Doctor, and Customer data, and embeddings
are generated using Bedrock Titan Embed Text v2.

It handles pagination automatically and provides progress updates.

Usage:
    # Process all reviews with default settings (25 per batch)
    python bulk_ingest.py
    
    # Custom batch size (not recommended > 50 due to embedding generation time)
    python bulk_ingest.py --batch-size 25
    
    # Test with a single review first
    python bulk_ingest.py --test --review-id review_373fvasqa4

Requirements:
    - AWS credentials configured (AWS CLI or environment variables)
    - boto3 installed: pip install boto3
    - Lambda function 'IngestionLambda' deployed with Bedrock permissions
"""

import boto3
import json
import time
import argparse
from datetime import datetime


def ingest_all_reviews(function_name, batch_size=25, region='us-east-1'):
    """
    Invoke Lambda function to process all reviews in batches.
    
    Args:
        function_name: Name of the Lambda function
        batch_size: Number of reviews to process per batch
        region: AWS region where Lambda is deployed
    """
    lambda_client = boto3.client('lambda', region_name=region)
    
    last_key = None
    total_processed = 0
    total_indexed = 0
    total_errors = 0
    batch_count = 0
    start_time = datetime.now()
    
    print(f"Starting bulk ingestion at {start_time}")
    print(f"Function: {function_name}, Batch size: {batch_size}, Region: {region}")
    print("-" * 80)
    
    try:
        while True:
            batch_count += 1
            batch_start = time.time()
            
            # Prepare payload
            payload = {
                'mode': 'batch',
                'batchSize': batch_size
            }
            
            if last_key:
                payload['lastEvaluatedKey'] = last_key
            
            # Invoke Lambda
            print(f"\nBatch {batch_count}: Invoking Lambda...")
            
            try:
                response = lambda_client.invoke(
                    FunctionName=function_name,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(payload)
                )
                
                # Parse response
                result = json.loads(response['Payload'].read())
                
                if result.get('statusCode') != 200:
                    print(f"Error: Lambda returned status code {result.get('statusCode')}")
                    print(f"Response: {result}")
                    break
                
                body = json.loads(result['body'])
                
                if not body.get('success'):
                    print(f"Error: {body.get('error')}")
                    break
                
                # Update counters
                processed = body.get('processed', 0)
                indexed = body.get('indexed', 0)
                errors = body.get('errors', 0)
                
                total_processed += processed
                total_indexed += indexed
                total_errors += errors
                
                batch_time = time.time() - batch_start
                
                # Print progress
                print(f"Batch {batch_count} completed in {batch_time:.2f}s:")
                print(f"  - Processed: {processed}")
                print(f"  - Indexed: {indexed}")
                print(f"  - Errors: {errors}")
                print(f"  - Total so far: {total_processed} processed, {total_indexed} indexed, {total_errors} errors")
                
                # Check for pagination
                last_key = body.get('lastEvaluatedKey')
                
                if not last_key:
                    print("\n" + "=" * 80)
                    print("All reviews processed!")
                    break
                
                # Rate limiting (avoid throttling)
                time.sleep(0.5)
            
            except Exception as e:
                print(f"Error invoking Lambda: {str(e)}")
                break
    
    except KeyboardInterrupt:
        print("\n\nIngestion interrupted by user")
    
    finally:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 80)
        print("INGESTION SUMMARY")
        print("=" * 80)
        print(f"Start time: {start_time}")
        print(f"End time: {end_time}")
        print(f"Duration: {duration:.2f} seconds ({duration/60:.2f} minutes)")
        print(f"Total batches: {batch_count}")
        print(f"Total processed: {total_processed}")
        print(f"Total indexed: {total_indexed}")
        print(f"Total errors: {total_errors}")
        
        if total_processed > 0:
            success_rate = (total_indexed / total_processed) * 100
            avg_time_per_review = duration / total_processed
            print(f"Success rate: {success_rate:.2f}%")
            print(f"Average time per review: {avg_time_per_review:.3f} seconds")
        
        print("=" * 80)


def test_single_review(function_name, review_id, region='us-east-1'):
    """
    Test ingestion with a single review.
    
    Args:
        function_name: Name of the Lambda function
        review_id: ID of the review to test
        region: AWS region where Lambda is deployed
    """
    lambda_client = boto3.client('lambda', region_name=region)
    
    payload = {
        'mode': 'single',
        'reviewId': review_id
    }
    
    print(f"Testing single review: {review_id}")
    print("-" * 80)
    
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        result = json.loads(response['Payload'].read())
        
        print(f"Status Code: {result.get('statusCode')}")
        print(f"Response: {json.dumps(json.loads(result['body']), indent=2)}")
    
    except Exception as e:
        print(f"Error: {str(e)}")


def main():
    parser = argparse.ArgumentParser(
        description='Bulk ingest DynamoDB reviews into OpenSearch'
    )
    
    parser.add_argument(
        '--function-name',
        default='IngestionLambda',
        help='Name of the Lambda function (default: IngestionLambda)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=25,
        help='Number of reviews to process per batch (default: 25, max recommended: 50)'
    )
    
    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region where Lambda is deployed (default: us-east-1)'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test mode: process only one review'
    )
    
    parser.add_argument(
        '--review-id',
        help='Review ID for test mode'
    )
    
    args = parser.parse_args()
    
    if args.test:
        if not args.review_id:
            print("Error: --review-id is required in test mode")
            return
        test_single_review(args.function_name, args.review_id, args.region)
    else:
        ingest_all_reviews(args.function_name, args.batch_size, args.region)


if __name__ == '__main__':
    main()
