import ChatComponent from "@/components/chat/ChatComponent"

export default function ProjectChatPage() {
    return (
        <main className="container mx-auto max-w-3xl p-4">
            <ChatComponent projectId="123" userId="abc" receiverId="xyz" />
        </main>
    )
}