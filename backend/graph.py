from dotenv import load_dotenv

from typing import List, Literal
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage, AIMessage

from langgraph.graph import MessagesState, StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import ToolNode, tools_condition

from growthbot.tools import tools

load_dotenv()


class State(MessagesState):
    summary: str = ""
    messages_summarized: int = 0


llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-001",
    streaming=True,
)
llm_with_tools = llm.bind_tools(tools)
llm_summarize = llm

system_prompt = """You are "GrowthBot," a friendly, enthusiastic, and helpful lead-generation assistant for Shield Digital Solutions.

Try your best to sound engaging and conversational. Add in emojis where appropriate.

(Important Demo Note: This is a demo. No real data is stored, and no emails are sent.)

Your goal: Guide users through a brief, in-conversation questionnaire to gather project details, while providing helpful and engaging information.

Here's how:

1.  Greet and Offer Help:
    * Start warmly.
    * State your ability to provide information about services, company, etc.
    * If the user asks "what do you have," or a similar query, list the available services in a clear, bulleted format:
        * Redesign Website: Give your existing site a fresh, modern look!
        * Create Website: Build a brand-new website tailored to your needs!
        * API Development: Connect your systems with powerful, custom APIs!
        * Payment Set Up/Gateway: Make it easy for your customers to pay!
        * Chatbot Services: Engage your visitors with helpful chatbots!

2.  Provide Service Details:
    * If the user expresses interest in a specific service, provide details about that service.
    * Use `get_service_detail` to get service details and present them in a formatted way (e.g., using bullet points or numbered lists).

3.  Conduct Questionnaire:
    * After discussing service details, smoothly transition to the questionnaire.
    * Explain that you'll ask a few questions to understand their needs.
    * Ask these three questions:
        * "If they already provided an interest in any service earlier, ask if they want any other services. Else, ask if they are interested in any of the services listed above." 
        * "How quickly are you looking to get started?"
        * "Would you prefer a live demo with us, or would you like us to send you more information via email?"

4.  Email or Live Demo
    * If the user chooses the email option in the questionnaire, go straight to step 5. 
    If they choose the live demo, tell them that you'll get it scheduled right away and in the meantime, ask what else you can help with.

5.  Handle Email Demo:
    * Use `store_client_info` and `send_detailed_questionnaire_email` to simulate.
    * Show the simulated email content (using "John Doe" and "john@example.com").
    * After that, ask if there's anything else you can help with.

6. Wrap Up:
    * If the user is done, thank them for their time.
    * Ask if they have any other questions or need further assistance.
    * Remind them that this is a demo and no real data is stored or sent.
    
Important:

* Be friendly, enthusiastic, and helpful.
* Use clear and organized formatting in your responses.
* Focus on gathering the questionnaire answers and providing relevant information.
* Be clear and engaging about the demo nature of the interaction.
"""


# --- Summarize Node (Improved Version) ---
def summarize_node(state: State) -> dict:
    """Summarizes messages and updates state. Called before END if threshold met."""
    messages: List[BaseMessage] = state["messages"]
    messages_summarized_idx: int = state.get("messages_summarized", 0)
    current_summary: str = state.get("summary", "")
    # print(f"DEBUG: Enter summarize_node. Summarizing from index {messages_summarized_idx}.") # Debug

    messages_to_summarize = messages[messages_summarized_idx:]
    if not messages_to_summarize:
        return {}

    content_to_summarize = "\n".join(
        [f"{msg.type}: {msg.content}" for msg in messages_to_summarize]
    )

    if current_summary:
        prompt_text = (
            f"Current summary:\n{current_summary}\n\n"
            f"Please concisely extend this summary with the following new messages:\n{content_to_summarize}"
        )
    else:
        prompt_text = f"Please create a concise summary of the following conversation:\n{content_to_summarize}"

    input_messages = [HumanMessage(content=prompt_text)]

    try:
        summary_response = llm_summarize.invoke(input_messages)
        new_summary = summary_response.content
        # print(f"DEBUG: Generated summary: {new_summary[:100]}...") # Debug
        return {
            "summary": new_summary,
            "messages_summarized": len(messages),  # Summarized up to the end
        }
    except Exception as e:
        print(f"ERROR: Summarization failed: {e}")
        return {}  # Return no updates on failure  # Return no updates on failure


# --- Chatbot Node (Unchanged Logic) ---
def chatbot_node(state: State) -> dict:
    """Invokes LLM with history and summary, returns new message."""
    messages: List[BaseMessage] = state["messages"]
    summary: str = state.get("summary", "")
    messages_summarized_idx: int = state.get("messages_summarized", 0)
    # print(f"DEBUG: Enter chatbot_node. Msgs: {len(messages)}, Summarized idx: {messages_summarized_idx}") # Debug

    recent_messages = messages[messages_summarized_idx:]
    if not recent_messages and messages:  # Handle potential edge case
        print(
            "WARNING: chatbot_node called with no recent messages but history exists."
        )
        # Use last message? Or just proceed? Let's proceed.
        pass
    elif not messages:  # Very first message
        print("DEBUG: chatbot_node starting initial turn.")
        # But we need *some* input message. The graph handles adding the first HumanMessage.
    prompt_content = system_prompt
    if summary:
        prompt_content += (
            f"\n\n# Summary of Prior Conversation:\n{summary}\n\n# Recent Messages:"
        )

    system_msg = SystemMessage(content=prompt_content)
    msgs_to_llm = [system_msg] + recent_messages

    try:
        response = llm_with_tools.invoke(msgs_to_llm)
        return {"messages": [response]}
    except Exception as e:
        print(f"ERROR: LLM invocation failed: {e}")
        return {"messages": [AIMessage(content=f"Sorry, an error occurred: {e}")]}


# --- ToolNode (Unchanged) ---
tool_node = ToolNode(tools=tools)


# --- Conditional Routing Logic (Combines tool check and summary check) ---
SUMMARIZATION_THRESHOLD = 6  # Define your threshold here


def route_chatbot_output(state: State):
    """
    Determines the next step after the chatbot node.
    1. Checks for tool calls. If yes, routes to "tools".
    2. If no tool calls, checks if summarization is needed. If yes, routes to "summarize".
    3. Otherwise (no tools, no summary needed), routes to END.
    """
    messages = state["messages"]
    if not messages:
        # print("DEBUG: route_chatbot_output: No messages, routing to END.") # Should not happen after chatbot
        return END

    last_message = messages[-1]

    # 1. Check for tool calls
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        # print("DEBUG: route_chatbot_output: Routing to tools.") # Debug
        return "tools"

    # 2. Check if summarization is needed (only if no tool calls)
    messages_summarized_idx = state.get("messages_summarized", 0)
    new_messages = messages[messages_summarized_idx:]
    relevant_new_messages_count = len(new_messages)  # Simplified for now

    if relevant_new_messages_count >= SUMMARIZATION_THRESHOLD:
        # print(f"DEBUG: route_chatbot_output: Routing to summarize (found {relevant_new_messages_count} relevant new messages).") # Debug
        return "summarize"
    else:
        # print(f"DEBUG: route_chatbot_output: Routing to END (only {relevant_new_messages_count} relevant new messages).") # Debug
        # 3. No tools and no summary needed
        return END


# --- Graph Construction (Updated Flow) ---
builder = StateGraph(State)

# Add nodes (Removed "should_summarize" node)
builder.add_node("chatbot", chatbot_node)
builder.add_node("tools", tool_node)
builder.add_node("summarize", summarize_node)  # Keep summarize node

# Define entry point
builder.set_entry_point("chatbot")

# Conditional edge after chatbot using the new routing function
builder.add_conditional_edges(
    "chatbot",  # Source node
    route_chatbot_output,  # Function deciding the next step
    {
        "tools": "tools",  # If function returns "tools"
        "summarize": "summarize",  # If function returns "summarize"
        END: END,  # If function returns END
    },
)

# Edge from tools back to chatbot
builder.add_edge("tools", "chatbot")

# Edge from summarize node to END
builder.add_edge("summarize", END)  # Summarization is the final step in its branch

# Compile the graph
graph = builder.compile()
