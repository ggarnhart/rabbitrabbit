import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConversation } from '@/lib/conversations/db'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create new conversation
    const conversation = await createConversation(user.id)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
