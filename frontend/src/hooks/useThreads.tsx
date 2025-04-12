"use client";

import { Client, Thread } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { toast } from "sonner";

export function useThreads(userId: string | undefined) {
  const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);
  const [userThreads, setUserThreads] = useState<Thread[]>([]);

  const createClient = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    return new Client({
      apiUrl,
    });
  };

  const createThread = async (id: string) => {
    const client = createClient();
    let thread;
    try {
      thread = await client.threads.create({
        metadata: {
          user_id: id,
          graph_id: "growthbot",
        },
      });
      if (!thread || !thread.thread_id) {
        throw new Error("Thread creation failed");
      }
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to create thread. Please try again.");
    }
    return thread;
  };

  const getUserThreads = async (id: string) => {
    try {
      setIsUserThreadsLoading(true);
      const client = createClient();

      const userThreads = (await client.threads.search({
        metadata: {
          user_id: id,
          graph_id: "growthbot",
        },
        limit: 100,
      })) as Awaited<Thread[]>;

      if (userThreads.length > 0) {
        const lastInArray = userThreads[0];
        const allButLast = userThreads.slice(1, userThreads.length);
        const filteredThreads = allButLast.filter(
          (thread) => thread.values && Object.keys(thread.values).length > 0
        );

        setUserThreads([...filteredThreads, lastInArray]);
      }
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setIsUserThreadsLoading(false);
    }
  };

  return {
    isUserThreadsLoading,
    userThreads,
    setUserThreads,
    getUserThreads,
    createThread,
  };
}
