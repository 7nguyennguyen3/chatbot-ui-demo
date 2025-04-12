import json
from typing import List
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()

company_info = {}
services_summary = {}
try:
    # Adjust path if necessary
    with open("./growthbot/info.json", "r", encoding="utf-8") as f:
        simplified_info = json.load(f)
        company_info = simplified_info.get("company_info", {})
        services_summary = simplified_info.get("services_summary", {})
    # Removed print statement
except FileNotFoundError:
    # Keep error messages as they indicate a critical failure
    print(
        "Error: info.json not found. Please create the file with the simplified company data."
    )
    exit()
except json.JSONDecodeError:
    print(
        "Error: Could not decode info.json. Please ensure it's valid JSON (simplified format)."
    )
    exit()
except Exception as e:
    print(f"An unexpected error occurred loading info.json: {e}")
    exit()


@tool
def get_company_details() -> str:
    """
    Provides general information about the company including summary, location, and contact details.
    """
    if not company_info:
        return "Sorry, I couldn't retrieve the company details right now."

    name = company_info.get("name", "Our Company")
    tagline = company_info.get("tagline", "")
    location = company_info.get("location", "Not specified")
    summary = company_info.get("summary", "No summary available.")
    contact = company_info.get("contact", {})
    email = contact.get("email", "N/A")
    website = contact.get("website", "N/A")
    phone = contact.get("phone", "N/A")

    details = (
        f"About {name} ({location}):\n"
        f"{summary}\n\n"
        f'Tagline: "{tagline}"\n\n'
        f"Contact:\n"
        f"- Email: {email}\n"
        f"- Website: {website}\n"
        f"- Phone: {phone}"
    )
    return details


@tool
def get_services_overview() -> str:
    """
    Lists the available services with a brief description for each.
    """
    service_list = services_summary.get("list", [])
    if not service_list:
        return "Sorry, I couldn't retrieve the list of services right now."

    overview = "Our Services:\n"
    for service in service_list:
        overview += f"- {service.get('name', 'Unnamed Service')}: {service.get('short_description', 'No description available.')}\n"

    overview += "\nWould you like to know more about any of these services?"
    return overview


@tool
def get_service_detail(service_names: str) -> str:
    """
    Provides detailed steps for one or more services. Supported service names are:
    - Redesign Website
    - Create Website
    - API Development
    - Payment Set Up/Gateway
    - Chatbot Services
    Separate service names with a comma if you want to request multiple services.
    """
    requested_services = [
        name.strip().lower() for name in service_names.split(",")
    ]  # Convert to lowercase
    available_services = {
        service.get("name").lower(): service
        for service in services_summary.get("list", [])
    }
    output = ""

    for requested_service in requested_services:
        if requested_service in available_services:
            service_info = available_services[requested_service]
            output += f"## {service_info.get('name')}\n"  # Use original name from data
            process = service_info.get("process")
            if process:
                output += "Here's how it typically works:\n"
                for i, step in enumerate(process):
                    output += f"{i+1}. {step}\n"
            else:
                output += "Details about the process for this service are not currently available.\n"
            output += "\n"
        else:
            output += f"Sorry, I don't have details for '{requested_service}'. Please check the list of available services.\n\n"

    return output.strip()


@tool
def get_pricing_overview() -> str:
    """
    Provides a general overview of the company's pricing approach.
    """
    pricing_approach = services_summary.get("pricing_approach", None)
    if not pricing_approach:
        return "Pricing information is currently unavailable. Please contact us for a quote."

    return f"Pricing Approach: {pricing_approach}"


@tool
def get_general_process() -> str:
    """
    Describes the general process the company follows for projects.
    """
    process = services_summary.get("general_process", None)
    if not process:
        return "Details about our general process are not available."
    return f"Our General Process: {process}"


@tool
def store_client_info(name: str, email: str, services_interested: List[str]) -> str:
    """
    (Simulation) Stores the client's name, email, and a list of services they are interested in.
    Returns a simple status message for the LLM.
    """

    if not services_interested:
        return f"Error simulation: No services specified by user '{name}' to store."
    else:
        return f"Status: OK - Simulated storing details for {name} -- Nothing has been stored, just a demo."


@tool
def send_detailed_questionnaire_email(name: str, email: str) -> str:
    """
    (Simulation) Generates the content of an email with a questionnaire link.
    Returns the simulated email content for the LLM to display.
    """
    return "Simulated Sending Email -- Nothing has been sent this is just a demo."


# --- Final Simplified Tools List ---
tools = [
    get_company_details,
    get_services_overview,
    get_service_detail,
    get_pricing_overview,
    get_general_process,
    store_client_info,
    send_detailed_questionnaire_email,
]

# Service names reference (remains the same)
SIMPLE_SERVICE_NAMES = [
    s.get("name") for s in services_summary.get("list", []) if s.get("name")
]
# Removed print statement for service names
