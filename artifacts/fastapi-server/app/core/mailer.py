import os
import asyncio
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_email(to: str, subject: str, html: str) -> bool:
    # Resolve the path to send-mail.js
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Path is e:\Access-Control-Hub\lib\mailer\send-mail.js
    # Relative to e:\Access-Control-Hub\artifacts\fastapi-server\app\core:
    # 1. .. -> app
    # 2. ../.. -> fastapi-server
    # 3. ../../.. -> artifacts
    # 4. ../../../.. -> Access-Control-Hub
    # 5. ../../../../lib/mailer/send-mail.js
    script_path = os.path.abspath(os.path.join(current_dir, "..", "..", "..", "..", "lib", "mailer", "send-mail.js"))
    
    if not os.path.exists(script_path):
        # Let's try also checking if we can find it relative to current working directory
        cwd_script_path = os.path.abspath(os.path.join("lib", "mailer", "send-mail.js"))
        if os.path.exists(cwd_script_path):
            script_path = cwd_script_path
        else:
            # Search parent directories of CWD
            search_path = os.getcwd()
            found = False
            for _ in range(5):
                test_path = os.path.join(search_path, "lib", "mailer", "send-mail.js")
                if os.path.exists(test_path):
                    script_path = test_path
                    found = True
                    break
                parent = os.path.dirname(search_path)
                if parent == search_path:
                    break
                search_path = parent
            if not found:
                logger.error(f"Mailer script not found at {script_path} or parent paths.")
                return False

    # Prepare environment variables for the Node process
    env = os.environ.copy()
    if settings.SMTP_HOST:
        env["SMTP_HOST"] = settings.SMTP_HOST
        env["SMTP_PORT"] = str(settings.SMTP_PORT)
        if settings.SMTP_USER:
            env["SMTP_USER"] = settings.SMTP_USER
        if settings.SMTP_PASS:
            env["SMTP_PASS"] = settings.SMTP_PASS
        if settings.SMTP_FROM:
            env["SMTP_FROM"] = settings.SMTP_FROM

    try:
        import subprocess

        def run_node_script():
            return subprocess.run(
                ["node", script_path, to, subject, html],
                capture_output=True,
                text=True,
                env=env
            )

        # Run the synchronous subprocess in a separate thread to avoid event loop issues on Windows
        result = await asyncio.to_thread(run_node_script)

        stdout_str = result.stdout.strip()
        stderr_str = result.stderr.strip()
        return_code = result.returncode

        if return_code == 0 and "MESSAGE_SENT_SUCCESSFULLY" in stdout_str:
            logger.info("Email sent successfully via nodemailer.")
            if stdout_str:
                print(f"Mailer Output:\n{stdout_str}")  # Make sure it prints to console for user visibility
                logger.info(f"Mailer Output:\n{stdout_str}")
            return True
        else:
            logger.error(f"Failed to send email. Return code: {return_code}")
            logger.error(f"Mailer Stdout: {stdout_str}")
            logger.error(f"Mailer Stderr: {stderr_str}")
            return False
    except Exception as e:
        import traceback
        logger.error(f"Exception raised while executing mailer subprocess: {str(e)}")
        traceback.print_exc()
        return False
