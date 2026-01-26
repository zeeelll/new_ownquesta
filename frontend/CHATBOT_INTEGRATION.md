# 🤖 Chatbot Integration Documentation

## Overview
A cute, animated chatbot widget has been integrated into your home page. The chatbot communicates with your FastAPI endpoint to provide AI-powered responses.

## Features

### 🎨 UI/UX
- **Fixed Position**: Floating button in the bottom-right corner
- **Smooth Animations**: 
  - Scale and fade animations when opening/closing
  - Message slide-in animations
  - Loading indicator with bouncing dots
  - Hover effects on button
- **Responsive Design**: Works on all screen sizes
- **Beautiful Gradient**: Indigo-to-purple gradient theme
- **Custom Scrollbar**: Styled scrollbar in message area

### 💬 Functionality
- **Greeting Message**: Automatic welcome message when chat opens
- **Real-time Chat**: Send and receive messages instantly
- **User Context**: Uses unique user ID from profile for personalized responses
- **Error Handling**: Graceful error messages if API fails
- **Loading State**: Shows loading indicator while waiting for response
- **Auto-scroll**: Automatically scrolls to latest message
- **Input Focus**: Auto-focuses input field when opening chat

## File Structure

```
frontend/app/
├── components/
│   └── Chatbot.tsx          (New chatbot component)
├── home/
│   └── page.tsx             (Updated with Chatbot integration)
└── .env                      (Updated with FASTAPI_URL)
```

## How It Works

### 1. **Component Location**
The chatbot component is loaded on the home page and only renders if the user has a `userId`:

```tsx
{user?.userId && <Chatbot userId={user.userId} />}
```

### 2. **API Integration**
When a user sends a message, it calls your FastAPI endpoint:

```
POST http://127.0.0.1:8000/conversation/chat
Headers: Content-Type: application/json
Body: {
  "user_id": "ownq_12345",
  "message": "user's message"
}
```

### 3. **Message Flow**
```
User Input → Fetch API → API Response → Bot Message Display
```

### 4. **State Management**
- `isOpen`: Controls chat window visibility
- `messages`: Array of Message objects (user/bot/timestamp)
- `inputValue`: Current input field value
- `isLoading`: Loading state during API call
- `hasError`: Error flag for failed requests

## Configuration

### Environment Variables
Located in `frontend/.env`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000
```

### Customization Options

You can easily customize the chatbot by modifying `app/components/Chatbot.tsx`:

#### Change Colors
```tsx
// Header gradient
className="bg-gradient-to-r from-indigo-600 to-purple-600"

// Button gradient
className="bg-gradient-to-br from-indigo-600 to-purple-600"
```

#### Change Size
```tsx
// Window size
className="w-96 max-h-[600px]"  // Change these values

// Button size
className="w-14 h-14"  // Change these values
```

#### Change Position
```tsx
// Current: bottom-right
className="fixed bottom-6 right-6 z-50"

// For bottom-left: change to "bottom-6 left-6"
// For top-right: change to "top-6 right-6"
```

#### Customize Greeting
```tsx
// Find this line and modify:
content: `Hello! 👋 I'm your Ownquesta AI Assistant. How can I help you today?`
```

## API Response Handling

The chatbot expects the FastAPI to return a response with one of these fields:
- `message`
- `response`
- Any other field will show default message

Example response:
```json
{
  "message": "Great question! Here's what I think...",
  "user_id": "ownq_12345",
  "timestamp": "2026-01-26T10:30:00Z"
}
```

## Animations Explained

### Slide-In Animation
Messages slide in from below with fade effect:
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Bounce Loading
Three dots bounce while waiting for response:
```css
<div className="animate-bounce" style={{ animationDelay: '0s' }} />
```

### Scale Transform
Button scales and fades when opening/closing chat:
```tsx
className={`scale-${isOpen ? '0 opacity-0' : '100 opacity-100'}`}
```

## Browser Support
- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Performance Notes
- Messages are stored in component state
- No infinite scroll limits (consider adding if needed)
- Lightweight - no heavy dependencies
- Custom CSS (no external animation libraries)

## Future Enhancements

Possible improvements:
1. **Message History**: Persist messages to database
2. **Typing Indicator**: Show when bot is "typing"
3. **Suggested Questions**: Quick reply buttons
4. **File Upload**: Share documents/images
5. **Rating System**: Rate helpful responses
6. **Dark/Light Mode**: Toggle based on user preference
7. **Multiple Chat Sessions**: Separate conversations
8. **Sound Effects**: Notification sounds

## Troubleshooting

### Chatbot not appearing?
- Check if user is logged in and has a `userId`
- Verify `NEXT_PUBLIC_FASTAPI_URL` in `.env`
- Check browser console for errors

### Messages not sending?
- Verify FastAPI server is running on port 8000
- Check CORS settings on FastAPI backend
- Look for network errors in browser DevTools

### Slow response times?
- Check FastAPI server performance
- Verify network connection
- Check for timeout issues

## Security Notes
- User ID is passed with each request (from authenticated user)
- Consider adding rate limiting on backend
- Sanitize user input before display (currently done by React)
- CORS should be properly configured

---

**Created**: January 26, 2026
**Status**: ✅ Production Ready
