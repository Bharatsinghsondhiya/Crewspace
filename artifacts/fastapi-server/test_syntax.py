import sys
import traceback

def check_syntax():
    try:
        import app.main
        print("SYNTAX OK")
    except Exception as e:
        print("SYNTAX ERROR:")
        traceback.print_exc()

if __name__ == "__main__":
    check_syntax()
