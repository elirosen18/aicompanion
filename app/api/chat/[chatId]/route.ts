import dotenv from "dotenv";
import { StreamingTextResponse, generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { currentUser } from "@clerk/nextjs";
// import { Replicate } from "langchain/llms/replicate";
// import { CallbackManager } from "langchain/callbacks";
import { NextResponse } from "next/server";

// import { MemoryManager } from "@/lib/memory";
import { ratelimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.username || !user.id)
      return new NextResponse("Unauthorized!", { status: 401 });

    const identifier = request.url + "-" + user.id;
    const { success } = await ratelimit(identifier);

    if (!success)
      return new NextResponse("Ratelimit Exceeded!", { status: 429 });

    const companion = await prismadb.companion.update({
      where: { id: params.chatId },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id
          }
        }
      }
    });

    if (!companion)
      return new NextResponse("Companion Not Found.", { status: 404 });
   
    const text = await streamText({
        model: openai("gpt-4o"),
        system: companion.instructions,
        prompt: prompt,
        async onFinish({text}) {

      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: text,
              role: "system",
              userId: user.id
            }
          }
        }
      });
        }
    });


    return new StreamingTextResponse(text.toAIStream());
  } catch (error) {
    console.log("[CHAT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
