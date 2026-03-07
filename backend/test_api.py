import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_2fa_setup():
    """Test the 2FA setup endpoint"""
    print("\n=== Testing 2FA Setup Endpoint ===")
    
    # First, create a test user if needed
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "customer"
    }
    
    try:
        # Create user
        create_response = requests.post(f"{BASE_URL}/users", json=user_data)
        if create_response.status_code == 200:
            user_id = create_response.json()["id"]
            print(f"Created test user with ID: {user_id}")
        elif create_response.status_code == 400 and "already registered" in create_response.json().get("detail", ""):
            # User might already exist, try to get the user
            users_response = requests.get(f"{BASE_URL}/users")
            users = users_response.json()
            user = next((u for u in users if u["username"] == user_data["username"]), None)
            if user:
                user_id = user["id"]
                print(f"Using existing test user with ID: {user_id}")
            else:
                print("Failed to find existing user")
                return False
        else:
            print(f"Failed to create test user: {create_response.status_code} - {create_response.text}")
            return False
        
        # Test 2FA setup
        setup_response = requests.post(f"{BASE_URL}/users/{user_id}/2fa/setup")
        
        # Check status code
        print(f"2FA Setup Status Code: {setup_response.status_code}")
        
        # Check response content
        if setup_response.status_code == 200:
            data = setup_response.json()
            print(f"Secret: {data.get('secret', 'Not found')}")
            print(f"OTP Auth URL: {data.get('otpauth_url', 'Not found')}")
            print(f"Backup Codes Count: {len(data.get('backup_codes', []))}")
            
            # Verify all expected fields are present
            if all(k in data for k in ['secret', 'otpauth_url', 'backup_codes']):
                print("✅ 2FA Setup endpoint test PASSED")
                return True
            else:
                print("❌ 2FA Setup endpoint test FAILED: Missing expected fields")
                return False
        else:
            print(f"❌ 2FA Setup endpoint test FAILED: {setup_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 2FA Setup endpoint test FAILED with exception: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS headers in the response"""
    print("\n=== Testing CORS Headers ===")
    
    try:
        # Make an OPTIONS request to check CORS headers
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        options_response = requests.options(f"{BASE_URL}/users/1/2fa/setup", headers=headers)
        
        # Check CORS headers
        cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers"
        ]
        
        print("CORS Headers in response:")
        for header in cors_headers:
            value = options_response.headers.get(header)
            print(f"  {header}: {value}")
            
        # Check if the Origin is allowed
        allow_origin = options_response.headers.get("Access-Control-Allow-Origin")
        if allow_origin and (allow_origin == "*" or "localhost:5173" in allow_origin):
            print("✅ CORS Headers test PASSED")
            return True
        else:
            print("❌ CORS Headers test FAILED: Origin not allowed")
            return False
            
    except Exception as e:
        print(f"❌ CORS Headers test FAILED with exception: {str(e)}")
        return False

def test_error_handling():
    """Test error handling by triggering an error condition"""
    print("\n=== Testing Error Handling ===")
    
    try:
        # Test with non-existent user ID
        error_response = requests.post(f"{BASE_URL}/users/99999/2fa/setup")
        
        # Check status code
        print(f"Error Response Status Code: {error_response.status_code}")
        
        # Check response content
        if error_response.status_code in [404, 500]:
            try:
                error_data = error_response.json()
                print(f"Error Detail: {error_data.get('detail', 'Not found')}")
                
                if 'detail' in error_data:
                    print("✅ Error Handling test PASSED")
                    return True
                else:
                    print("❌ Error Handling test FAILED: No error detail in response")
                    return False
            except json.JSONDecodeError:
                print("❌ Error Handling test FAILED: Response is not valid JSON")
                return False
        else:
            print(f"❌ Error Handling test FAILED: Unexpected status code {error_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error Handling test FAILED with exception: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and report results"""
    print("Starting API Tests...")
    
    test_results = {
        "2FA Setup": test_2fa_setup(),
        "CORS Headers": test_cors_headers(),
        "Error Handling": test_error_handling()
    }
    
    print("\n=== Test Summary ===")
    all_passed = True
    for test_name, result in test_results.items():
        status = "PASSED" if result else "FAILED"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        print("\n✅ All tests PASSED!")
    else:
        print("\n❌ Some tests FAILED!")

if __name__ == "__main__":
    run_all_tests()
