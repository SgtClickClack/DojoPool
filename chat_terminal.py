import os
import requests
from dotenv import load_dotenv
from typing import Optional, Dict, List, Any, Tuple
import glob
from pathlib import Path
import json
from datetime import datetime
import re
import traceback

# Load environment variables
load_dotenv()


class AIModel:
    def __init__(self, name: str, engine: str, base_url: str, api_key: str):
        self.name = name
        self.engine = engine
        self.base_url = base_url
        self.api_key = api_key


class ChatTerminal:
    def __init__(self):
        self.workspace_path = os.getcwd()
        self.conversation_history = []
        self.session_file = "chat_session.json"

        # Initialize AI models
        goose_key = os.getenv("GOOSE_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        self.models = {}

        if goose_key:
            self.models["goose"] = AIModel(
                "GooseAI", "gpt-neo-20b", "https://api.goose.ai/v1", goose_key
            )

        if openai_key:
            self.models["openai"] = AIModel(
                "OpenAI", "gpt-3.5-turbo", "https://api.openai.com/v1", openai_key
            )

        if not self.models:
            print(
                "ERROR: No API keys found! Please set either GOOSE_API_KEY or OPENAI_API_KEY in your environment."
            )
            print(
                "You can create a .env file with these variables or set them in your system environment."
            )
            print("Example .env file:")
            print("GOOSE_API_KEY=your_goose_api_key_here")
            print("OPENAI_API_KEY=your_openai_api_key_here")
            raise ValueError("No API keys configured")

        # Use preferred provider from .env or first available
        preferred_provider = os.getenv("PREFERRED_AI_PROVIDER", "openai")
        self.current_model = self.models.get(preferred_provider) or next(iter(self.models.values()))

        print(f"Available models: {', '.join(self.models.keys())}")
        print(f"Using {self.current_model.name} as default model")

        self.system_prompt = """You are a helpful AI assistant with expertise in programming and software development. 
You have access to the workspace files and can help analyze code, suggest improvements, and answer questions.
You provide clear, concise, and accurate responses. When discussing code, you use proper formatting and explain your reasoning.
You maintain context throughout the conversation and ask for clarification when needed.
When analyzing code, consider:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security considerations
5. Architecture and design patterns"""

    def save_session(self) -> None:
        """Save the current session to a file."""
        session_data = {
            "timestamp": datetime.now().isoformat(),
            "model": self.current_model.name,
            "history": self.conversation_history,
        }
        with open(self.session_file, "w") as f:
            json.dump(session_data, f, indent=2)

    def load_session(self) -> bool:
        """Load a previous session if it exists."""
        try:
            if os.path.exists(self.session_file):
                with open(self.session_file, "r") as f:
                    session_data = json.load(f)
                self.conversation_history = session_data["history"]
                if session_data["model"] in self.models:
                    self.current_model = self.models[session_data["model"].lower()]
                return True
        except Exception as e:
            print(f"Error loading session: {str(e)}")
        return False

    def search_files(self, pattern: str) -> List[str]:
        """Search for files matching a pattern."""
        matches = []
        try:
            for root, _, files in os.walk(self.workspace_path):
                for file in files:
                    if re.search(pattern, file, re.IGNORECASE):
                        matches.append(
                            os.path.relpath(os.path.join(root, file), self.workspace_path)
                        )
        except Exception as e:
            print(f"Error searching files: {str(e)}")
        return matches

    def analyze_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Analyze a file and return insights."""
        try:
            content = self.read_file(file_path)
            if not content:
                return None

            # Get file info
            file_info = {
                "path": file_path,
                "size": os.path.getsize(file_path),
                "last_modified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                "extension": os.path.splitext(file_path)[1],
                "lines": len(content.splitlines()),
            }

            # Send for AI analysis
            analysis_prompt = f"""Analyze this file and provide insights:
Path: {file_path}
Content:
{content[:1000]}  # First 1000 chars for context

Provide analysis on:
1. Code quality
2. Potential issues
3. Improvements
4. Security concerns
"""
            analysis = self.send_message(analysis_prompt)

            return {"file_info": file_info, "analysis": analysis}
        except Exception as e:
            print(f"Error analyzing file: {str(e)}")
            return None

    def read_file(self, file_path: str) -> Optional[str]:
        """Read contents of a file in the workspace."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {file_path}: {str(e)}")
            return None

    def list_workspace_files(self, pattern: str = "**/*") -> List[str]:
        """List all files in workspace matching the pattern."""
        files = []
        for file in glob.glob(os.path.join(self.workspace_path, pattern), recursive=True):
            if os.path.isfile(file) and not any(
                p in file for p in [".git", "__pycache__", "node_modules"]
            ):
                files.append(os.path.relpath(file, self.workspace_path))
        return files

    def get_workspace_context(self, query: str) -> str:
        """Get relevant workspace context based on the query."""
        context = "Workspace files:\n"

        # Try to find relevant files based on query keywords
        keywords = query.lower().split()
        relevant_files = []

        for file in self.list_workspace_files():
            if any(keyword in file.lower() for keyword in keywords):
                relevant_files.append(file)

        # If no relevant files found, show recent ones
        if not relevant_files:
            files = self.list_workspace_files()
            relevant_files = sorted(
                files,
                key=lambda f: os.path.getmtime(os.path.join(self.workspace_path, f)),
                reverse=True,
            )[:10]

        context += "\n".join(f"- {f}" for f in relevant_files)
        return context

    def switch_model(self, model_name: str) -> bool:
        """Switch between AI models."""
        if model_name in self.models:
            self.current_model = self.models[model_name]
            return True
        return False

    def format_openai_messages(
        self, message: str, workspace_context: str = ""
    ) -> List[Dict[str, str]]:
        """Format messages for OpenAI API."""
        messages = [{"role": "system", "content": self.system_prompt}]

        if workspace_context:
            messages.append({"role": "system", "content": workspace_context})

        # Add conversation history
        for msg in self.conversation_history[-5:]:  # Last 5 messages
            messages.extend(
                [
                    {"role": "user", "content": msg["human"]},
                    {"role": "assistant", "content": msg["assistant"]},
                ]
            )

        # Add current message
        messages.append({"role": "user", "content": message})
        return messages

    def send_message(self, message: str) -> Optional[str]:
        """Send a message to the current AI model and get the response."""
        try:
            # Verify API key
            if not self.current_model.api_key:
                print(f"Error: No API key found for {self.current_model.name}")
                return None

            # Add workspace context if message seems to need it
            workspace_context = ""
            if any(
                keyword in message.lower()
                for keyword in ["file", "code", "workspace", "project", "analyze"]
            ):
                workspace_context = self.get_workspace_context(message)

            if self.current_model.name == "OpenAI":
                messages = self.format_openai_messages(message, workspace_context)
                response = requests.post(
                    f"{self.current_model.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.current_model.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.current_model.engine,
                        "messages": messages,
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
            else:  # GooseAI
                # Build the conversation context
                context = self.system_prompt + "\n\n"
                if workspace_context:
                    context += workspace_context + "\n\n"
                context += "\n".join(
                    [
                        f"Human: {msg['human']}\nAssistant: {msg['assistant']}"
                        for msg in self.conversation_history[-5:]
                    ]
                )

                prompt = f"{context}\nHuman: {message}\nAssistant: Let me help you with that.\n"

                response = requests.post(
                    f"{self.current_model.base_url}/engines/{self.current_model.engine}/completions",
                    headers={
                        "Authorization": f"Bearer {self.current_model.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "prompt": prompt,
                        "max_tokens": 500,
                        "temperature": 0.3,
                        "top_p": 0.95,
                        "frequency_penalty": 0.3,
                        "presence_penalty": 0.3,
                        "stop": ["Human:", "\n\n\n"],
                    },
                )

            if response.status_code == 200:
                result = response.json()
                if self.current_model.name == "OpenAI":
                    assistant_response = result["choices"][0]["message"]["content"].strip()
                else:
                    assistant_response = result["choices"][0]["text"].strip()

                # Store the conversation
                self.conversation_history.append(
                    {"human": message, "assistant": assistant_response}
                )
                self.save_session()
                return assistant_response
            else:
                print(f"Error: API returned status code {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            traceback.print_exc()
            return None

    def start_chat(self):
        """Start the interactive chat session."""
        # Try to load previous session
        if self.load_session():
            print("Previous session loaded!")

        print(f"Welcome to the AI Chat Terminal! Current model: {self.current_model.name}")
        print("Type 'exit' to end the conversation")
        print("Type 'clear' to clear conversation history")
        print("Type 'model goose' or 'model openai' to switch models")
        print("Type 'files' to list workspace files")
        print("Type 'read <filename>' to read a file")
        print("Type 'search <pattern>' to search files")
        print("Type 'analyze <filename>' for code analysis")
        print("Type 'help' for more commands")
        print("-" * 50)

        while True:
            user_input = input("\nYou: ").strip()

            if user_input.lower() == "exit":
                print("\nSaving session...")
                self.save_session()
                print("Goodbye!")
                break

            if user_input.lower() == "clear":
                self.conversation_history = []
                print("\nConversation history cleared.")
                continue

            if user_input.lower().startswith("model "):
                model = user_input.lower().split()[1]
                if self.switch_model(model):
                    print(f"\nSwitched to {self.current_model.name}")
                else:
                    print(f"\nInvalid model. Available models: {', '.join(self.models.keys())}")
                continue

            if user_input.lower() == "files":
                print("\nWorkspace files:")
                for file in self.list_workspace_files():
                    print(f"- {file}")
                continue

            if user_input.lower().startswith("search "):
                pattern = user_input[7:].strip()
                print(f"\nSearching for files matching '{pattern}':")
                matches = self.search_files(pattern)
                if matches:
                    for match in matches:
                        print(f"- {match}")
                else:
                    print("No matches found.")
                continue

            if user_input.lower().startswith("analyze "):
                filename = user_input[8:].strip()
                print(f"\nAnalyzing {filename}...")
                analysis = self.analyze_file(filename)
                if analysis:
                    print("\nFile Information:")
                    for key, value in analysis["file_info"].items():
                        print(f"- {key}: {value}")
                    print("\nAnalysis:")
                    print(analysis["analysis"])
                continue

            if user_input.lower().startswith("read "):
                filename = user_input[5:].strip()
                content = self.read_file(filename)
                if content:
                    print(f"\nContents of {filename}:")
                    print("-" * 50)
                    print(content)
                    print("-" * 50)
                continue

            if user_input.lower() == "help":
                print("\nAvailable commands:")
                print("- exit: End the conversation")
                print("- clear: Clear conversation history")
                print("- model <name>: Switch AI model (goose/openai)")
                print("- files: List workspace files")
                print("- search <pattern>: Search for files")
                print("- read <filename>: Read contents of a file")
                print("- analyze <filename>: Analyze code in a file")
                print("- help: Show this help message")
                continue

            if not user_input:
                continue

            print(f"\n{self.current_model.name}: ", end="", flush=True)
            response = self.send_message(user_input)

            if response:
                print(response)
            else:
                print("Sorry, I couldn't generate a response. Please try again.")


def main():
    chat = ChatTerminal()
    chat.start_chat()


if __name__ == "__main__":
    main()
