import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def test_goose():
    """Test GooseAI integration for code assistance."""
    api_key = os.getenv("GOOSE_API_KEY")
    if not api_key:
        print("Error: GOOSE_API_KEY not found in environment variables")
        return

    print(f"Using API key: {api_key[:10]}...")
    base_url = "https://api.goose.ai/v1"

    # Create a coding-related prompt
    prompt = """Fix and complete this Python code:

class PoolScorer:
    def __init__(self):
        self.player1_wins = 0
        self.player2_wins = 0
    
    def add_win(self, player):
        # TODO: Implement this method
        pass
    
    def get_stats(self):
        # TODO: Return dictionary with games played, win counts, and percentages
        pass

# Fix the code and implement the missing methods."""

    try:
        print("Sending request to GooseAI...")
        # Test the API key with a simple completion request
        response = requests.post(
            f"{base_url}/engines/gpt-neo-20b/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "prompt": prompt,
                "max_tokens": 400,
                "temperature": 0.2,  # Even lower for more precise code
                "top_p": 0.95,
                "frequency_penalty": 0.1,
                "presence_penalty": 0.1,
                "stop": ["```", "# Example usage", "\n\n\n"],
            },
        )

        print(f"Response status code: {response.status_code}")
        if response.status_code == 200:
            print("GooseAI test successful!")
            result = response.json()
            if "choices" in result and result["choices"]:
                print("\nGenerated Code:")
                print("```python")
                print(result["choices"][0]["text"].strip())
                print("```")

                # Save the code to a new file for testing
                code = result["choices"][0]["text"].strip()
                with open("pool_scorer.py", "w") as f:
                    f.write(code)
                print("\nCode has been saved to pool_scorer.py")
            else:
                print("\nNo code generated in response")
        else:
            print(f"Error: {response.status_code}")
            print("Response text:", response.text)

    except Exception as e:
        print(f"Error testing GooseAI: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_goose()
