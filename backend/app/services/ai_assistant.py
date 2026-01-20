"""
AI Assistant Service - OpenAI Integration with NLP Enhancements
Handles chatbot conversations with context memory and intent detection
"""
import os
import json
import asyncio
from typing import Optional, List, Dict, AsyncGenerator
from datetime import datetime
import httpx
from pydantic import BaseModel

# Get API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


class Message(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: Optional[str] = None


class ConversationContext:
    """Maintains conversation history and context for multi-turn conversations"""
    
    def __init__(self, max_history: int = 20):
        self.messages: List[Dict[str, str]] = []
        self.max_history = max_history
        self.user_preferences: Dict = {}
        self.detected_intents: List[str] = []
    
    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        # Keep only recent messages to manage context window
        if len(self.messages) > self.max_history:
            # Keep system message + recent messages
            self.messages = self.messages[:1] + self.messages[-(self.max_history-1):]
    
    def get_messages(self) -> List[Dict[str, str]]:
        return self.messages
    
    def clear(self):
        self.messages = []
        self.detected_intents = []


# Store conversation contexts per session
conversation_store: Dict[str, ConversationContext] = {}


def get_or_create_context(session_id: str) -> ConversationContext:
    """Get or create a conversation context for a session"""
    if session_id not in conversation_store:
        context = ConversationContext()
        # Add system prompt for the sales dashboard assistant
        context.add_message("system", get_system_prompt())
        conversation_store[session_id] = context
    return conversation_store[session_id]


def get_system_prompt() -> str:
    """Get the system prompt for the AI assistant"""
    return """You are Lulu AI, an intelligent sales analytics assistant for the Lulu Hypermarket dashboard. 

Your capabilities:
- Analyze sales trends and patterns
- Explain dashboard metrics and KPIs
- Provide insights on store performance
- Answer questions about products, categories, and sales data
- Help users understand predictions and forecasts
- Suggest actionable recommendations based on data

Guidelines:
- Be concise but thorough in your responses
- Use data-driven language when discussing analytics
- Format numbers and statistics clearly
- If asked about specific data you don't have, suggest where to find it on the dashboard
- Be friendly and professional
- Use bullet points for lists
- Highlight key insights

Current context: Real-time sales dashboard showing live streaming data, historical trends, store performance, and predictive analytics for Lulu Hypermarket chain in UAE."""


def detect_intent(message: str) -> Dict:
    """Basic intent detection using keyword matching"""
    message_lower = message.lower()
    
    intents = {
        "sales_query": ["sales", "revenue", "sold", "selling", "performance"],
        "trend_analysis": ["trend", "pattern", "growth", "decline", "compare"],
        "store_query": ["store", "location", "branch", "outlet"],
        "product_query": ["product", "item", "category", "top selling"],
        "prediction": ["predict", "forecast", "future", "expect", "projection"],
        "help": ["help", "how to", "what is", "explain", "guide"],
        "greeting": ["hello", "hi", "hey", "good morning", "good afternoon"],
    }
    
    detected = []
    for intent, keywords in intents.items():
        if any(kw in message_lower for kw in keywords):
            detected.append(intent)
    
    # Detect sentiment
    positive_words = ["good", "great", "excellent", "amazing", "increase", "growth"]
    negative_words = ["bad", "poor", "decline", "decrease", "problem", "issue"]
    
    sentiment = "neutral"
    if any(word in message_lower for word in positive_words):
        sentiment = "positive"
    elif any(word in message_lower for word in negative_words):
        sentiment = "negative"
    
    return {
        "intents": detected if detected else ["general"],
        "sentiment": sentiment
    }


def get_fallback_response(message: str) -> str:
    """Generate intelligent fallback response when OpenAI API is unavailable"""
    message_lower = message.lower()
    
    # Greeting responses
    if any(word in message_lower for word in ["hello", "hi", "hey", "greetings"]):
        return "👋 Hello! I'm Lulu AI, your sales analytics assistant. I'm currently running in offline mode, but I can still help you navigate the dashboard!\n\n**Here's what you can explore:**\n• **KPI Cards** - View today's sales, weekly revenue, and transaction counts\n• **Sales Trend Chart** - Analyze historical sales patterns\n• **Live Feed** - Watch real-time sales as they happen\n• **Store Distribution** - Compare performance across stores\n\nIs there something specific you'd like to know about?"
    
    # Sales queries
    if any(word in message_lower for word in ["sales", "revenue", "sold", "selling"]):
        return "📊 **About Sales Data:**\n\nYou can view sales information in several ways:\n\n1. **KPI Cards (Top)** - Shows:\n   • Today's total sales\n   • Weekly revenue\n   • Monthly performance\n   • Average transaction value\n\n2. **Sales Trend Chart** - Displays historical patterns\n\n3. **Live Sales Feed** - Real-time transactions\n\n4. **Category Breakdown** - Sales by product category\n\nCheck the dashboard for current numbers!"
    
    # Store queries
    if any(word in message_lower for word in ["store", "location", "branch", "outlet"]):
        return "🏪 **Store Information:**\n\nThe dashboard tracks 10 Lulu Hypermarket locations across UAE:\n\n• **Abu Dhabi** - Mushrif Mall, Capital Mall\n• **Dubai** - Deira City Centre, Mall of the Emirates, Al Barsha, Silicon Oasis\n• **Sharjah** - City Centre Sharjah\n• **Ajman** - City Centre Ajman\n• **Fujairah** - Main branch\n• **Ras Al Khaimah** - Main branch\n\nUse the **Store Distribution Chart** to compare performance!"
    
    # Product/category queries
    if any(word in message_lower for word in ["product", "item", "category", "categories", "top selling"]):
        return "🛒 **Product Categories:**\n\nWe track sales across these categories:\n\n• **Dairy** - Milk, cheese, yogurt\n• **Beverages** - Soft drinks, juices, energy drinks\n• **Bakery** - Bread, pastries\n• **Personal Care** - Shampoo, soap, cosmetics\n• **Household** - Cleaning supplies\n• **Snacks** - Chips, chocolates\n• **Grocery** - Rice, flour, oil\n\nCheck the **Top Items Chart** and **Category Breakdown** for performance data!"
    
    # Trend queries
    if any(word in message_lower for word in ["trend", "pattern", "growth", "decline"]):
        return "📈 **Trend Analysis:**\n\nTo analyze trends, look at:\n\n1. **Sales Trend Chart** - Shows daily/weekly patterns\n2. **Week-over-Week Comparison** - In KPI cards\n3. **Streaming Data Count** - New sales velocity\n\n**Tips:**\n• Look for seasonal patterns\n• Compare weekday vs weekend\n• Identify peak hours\n\nThe data refreshes every 10 seconds with new sales!"
    
    # Prediction queries
    if any(word in message_lower for word in ["predict", "forecast", "future", "expect"]):
        return "🔮 **Predictions:**\n\nThe dashboard includes predictive analytics:\n\n• **Next Hour Forecast** - Expected sales volume\n• **Daily Projections** - Revenue predictions\n• **Trend Indicators** - Growth/decline arrows\n\nPredictions are based on:\n• Historical patterns\n• Day of week\n• Time of day\n• Recent momentum\n\nCheck the **Prediction Card** for current forecasts!"
    
    # Help queries
    if any(word in message_lower for word in ["help", "how to", "guide", "tutorial"]):
        return "📖 **Dashboard Guide:**\n\n**Navigation:**\n• All metrics update in real-time\n• Hover over charts for details\n• Use the Live Feed to see individual sales\n\n**Key Features:**\n1. **KPI Cards** - Quick metrics overview\n2. **Charts** - Visual analytics\n3. **Live Table** - Real-time transactions\n4. **AI Chat** - Ask questions (that's me!)\n\n**Voice Commands:**\n• Hold the 🎤 button to speak\n• Toggle 🔊 for auto-speak responses\n\nNeed specific help with something?"
    
    # Default response
    return "👋 I'm Lulu AI, currently in offline mode.\n\n**I can help with:**\n• 📊 Sales analytics questions\n• 🏪 Store information\n• 🛒 Product categories\n• 📈 Trend analysis\n• 🔮 Predictions\n\n**Try asking:**\n• \"What are today's sales?\"\n• \"Show me store performance\"\n• \"What are the top categories?\"\n\nThe dashboard displays real-time data that updates every 10 seconds!"


async def stream_chat_response(
    session_id: str,
    user_message: str
) -> AsyncGenerator[str, None]:
    """Stream chat response from OpenAI API with fallback"""
    
    context = get_or_create_context(session_id)
    
    # Detect intent for logging/analytics
    intent_info = detect_intent(user_message)
    context.detected_intents.extend(intent_info["intents"])
    
    # Add user message to context
    context.add_message("user", user_message)
    
    # Check if API key is available
    if not OPENAI_API_KEY:
        fallback = get_fallback_response(user_message)
        context.add_message("assistant", fallback)
        # Stream fallback response word by word for better UX
        words = fallback.split(' ')
        for i, word in enumerate(words):
            yield word + (' ' if i < len(words) - 1 else '')
            await asyncio.sleep(0.02)  # Small delay for streaming effect
        return
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": context.get_messages(),
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    full_response = ""
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                OPENAI_API_URL,
                headers=headers,
                json=payload
            ) as response:
                if response.status_code == 429:
                    # Rate limited - use fallback
                    fallback = get_fallback_response(user_message)
                    context.add_message("assistant", fallback)
                    words = fallback.split(' ')
                    for i, word in enumerate(words):
                        yield word + (' ' if i < len(words) - 1 else '')
                        await asyncio.sleep(0.02)
                    return
                elif response.status_code != 200:
                    error_text = await response.aread()
                    # Use fallback for any API error
                    fallback = get_fallback_response(user_message)
                    context.add_message("assistant", fallback)
                    words = fallback.split(' ')
                    for i, word in enumerate(words):
                        yield word + (' ' if i < len(words) - 1 else '')
                        await asyncio.sleep(0.02)
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_response += content
                                    yield content
                        except json.JSONDecodeError:
                            continue
        
        # Add assistant response to context
        if full_response:
            context.add_message("assistant", full_response)
            
    except httpx.TimeoutException:
        fallback = "⏱️ Request timed out. " + get_fallback_response(user_message)
        context.add_message("assistant", fallback)
        words = fallback.split(' ')
        for i, word in enumerate(words):
            yield word + (' ' if i < len(words) - 1 else '')
            await asyncio.sleep(0.02)
    except Exception as e:
        fallback = get_fallback_response(user_message)
        context.add_message("assistant", fallback)
        words = fallback.split(' ')
        for i, word in enumerate(words):
            yield word + (' ' if i < len(words) - 1 else '')
            await asyncio.sleep(0.02)


async def get_chat_response(
    session_id: str,
    user_message: str
) -> str:
    """Get non-streaming chat response with fallback"""
    
    context = get_or_create_context(session_id)
    context.add_message("user", user_message)
    
    if not OPENAI_API_KEY:
        fallback = get_fallback_response(user_message)
        context.add_message("assistant", fallback)
        return fallback
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": context.get_messages(),
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENAI_API_URL,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 429 or response.status_code != 200:
                # Rate limited or error - use fallback
                fallback = get_fallback_response(user_message)
                context.add_message("assistant", fallback)
                return fallback
            
            data = response.json()
            assistant_message = data["choices"][0]["message"]["content"]
            context.add_message("assistant", assistant_message)
            return assistant_message
            
    except Exception as e:
        fallback = get_fallback_response(user_message)
        context.add_message("assistant", fallback)
        return fallback


def clear_conversation(session_id: str):
    """Clear conversation history for a session"""
    if session_id in conversation_store:
        conversation_store[session_id].clear()
        conversation_store[session_id].add_message("system", get_system_prompt())


def get_conversation_summary(session_id: str) -> Dict:
    """Get summary of conversation for a session"""
    if session_id not in conversation_store:
        return {"message_count": 0, "intents": [], "active": False}
    
    context = conversation_store[session_id]
    return {
        "message_count": len(context.messages),
        "intents": list(set(context.detected_intents)),
        "active": True
    }
