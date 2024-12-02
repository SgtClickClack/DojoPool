import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define workspace paths
workspace1 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo_Pool_fresh"
workspace2 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo Pool"
workspace3 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo Pool"  # Assuming this is the same as workspace2
combined_workspace = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\combined"

def list_files_in_workspace(workspace):
    """
    Lists all files in the specified workspace directory.

    :param workspace: The path to the workspace directory.
    """
    if not os.path.exists(workspace):
        logging.error(f"Workspace does not exist: {workspace}")
        return

    try:
        files = os.listdir(workspace)
        if files:
            logging.info(f"Files in {workspace}:")
            for file in files:
                logging.info(f" - {file}")
        else:
            logging.info(f"No files found in {workspace}.")

    except PermissionError:
        logging.error(f"Permission denied accessing {workspace}.")
    except Exception as e:
        logging.error(f"Error accessing {workspace}: {e}")

def main():
    """
    Main function to list files in all defined workspaces.
    """
    workspaces = [workspace1, workspace2, workspace3, combined_workspace]
    for workspace in workspaces:
        list_files_in_workspace(workspace)

if __name__ == "__main__":
    main()