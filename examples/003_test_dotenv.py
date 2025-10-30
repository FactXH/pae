from dotenv import load_dotenv
import os

load_dotenv()  # reads .env in the current directory

print(os.getenv("tair_ak"))