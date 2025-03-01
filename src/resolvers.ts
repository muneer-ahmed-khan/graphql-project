import { PrismaClient } from "@prisma/client";
import { Resolvers } from "./generated/graphql";

const prisma = new PrismaClient();

/**
 * Helper functions to “normalize” returned objects so that they include all required fields.
 */
function normalizeUser(user: any) {
  return {
    ...user,
    posts: user.posts ?? [],
    comments: user.comments ?? [],
    likes: user.likes ?? [],
    messagesSent: user.messagesSent ?? [],
    messagesReceived: user.messagesReceived ?? [],
    notifications: user.notifications ?? [],
    profile: user.profile ?? null,
    __typename: "User",
  };
}

function normalizePost(post: any) {
  const normalizedTags = (post.tags ?? [])
    .map((pt: any) => pt.tag)
    .filter((tag: any) => tag != null);
  console.log("check post likes ", post.likes);

  return {
    ...post,
    comments: post.comments ?? [],
    likes: post.likes ?? [],
    tags: normalizedTags,
    __typename: "Post",
  };
}

function normalizeComment(comment: any) {
  return { ...comment, __typename: "Comment" };
}

function normalizeProfile(profile: any) {
  return { ...profile, __typename: "Profile" };
}

function normalizeLike(like: any) {
  return { ...like, __typename: "Like" };
}

function normalizeCategory(category: any) {
  return { ...category, __typename: "Category" };
}

function normalizeTag(tag: any) {
  return {
    ...tag,
    // Convert join records to Post objects:
    posts: (tag.posts ?? []).map((joinRecord: any) => joinRecord.post),
    __typename: "Tag",
  };
}

function normalizeMessage(message: any) {
  return { ...message, __typename: "Message" };
}

function normalizeNotification(notification: any) {
  return { ...notification, __typename: "Notification" };
}

export const resolvers: Resolvers = {
  Query: {
    node: async (_, { id }) => {
      // Try to find a User.
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          posts: true,
          comments: true,
          likes: true,
          messagesSent: true,
          messagesReceived: true,
          notifications: true,
          profile: true,
        },
      });
      if (user) return normalizeUser(user);

      // Try to find a Post.
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: true,
          comments: true,
          likes: true,
          category: true,
          tags: { include: { tag: true } },
        },
      });
      if (post) return normalizePost(post);

      // Try to find a Comment.
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { author: true, post: true },
      });
      if (comment) return normalizeComment(comment);

      // Try to find a Profile.
      const profile = await prisma.profile.findUnique({ where: { id } });
      if (profile) return normalizeProfile(profile);

      // Try to find a Like.
      const like = await prisma.like.findUnique({
        where: { id },
        include: { user: true, post: true },
      });
      if (like) return normalizeLike(like);

      // Try to find a Tag.
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: { posts: { include: { post: true } } },
      });
      if (tag) return normalizeTag(tag);

      // Try to find a Category.
      const category = await prisma.category.findUnique({
        where: { id },
        include: { posts: true },
      });
      if (category) return normalizeCategory(category);

      // Try to find a Message.
      const message = await prisma.message.findUnique({
        where: { id },
        include: { sender: true, receiver: true },
      });
      if (message) return normalizeMessage(message);

      // Try to find a Notification.
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: { user: true },
      });
      if (notification) return normalizeNotification(notification);

      return null;
    },

    search: async (_, { text }) => {
      const users = await prisma.user.findMany({
        where: { name: { contains: text, mode: "insensitive" } },
        include: {
          posts: true,
          comments: true,
          likes: true,
          messagesSent: true,
          messagesReceived: true,
          notifications: true,
          profile: true,
        },
      });
      const posts = await prisma.post.findMany({
        where: { title: { contains: text, mode: "insensitive" } },
        include: {
          author: true,
          comments: true,
          likes: true,
          category: true,
          tags: { include: { tag: true } },
        },
      });
      const comments = await prisma.comment.findMany({
        where: { text: { contains: text, mode: "insensitive" } },
        include: { author: true, post: true },
      });
      return [
        ...users.map(normalizeUser),
        ...posts.map(normalizePost),
        ...comments.map(normalizeComment),
      ];
    },

    getUser: async (_, { id }) => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          posts: true,
          comments: true,
          likes: true,
          messagesSent: true,
          messagesReceived: true,
          notifications: true,
          profile: true,
        },
      });
      return user ? normalizeUser(user) : null;
    },

    getPost: async (_, { id }) => {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: true,
          comments: true,
          likes: { include: { user: true } },
          category: true,
          tags: { include: { tag: true } },
        },
      });
      return post ? normalizePost(post) : null;
    },

    getCategory: async (_, { id }) => {
      const category = await prisma.category.findUnique({
        where: { id },
        include: { posts: true },
      });
      return category ? normalizeCategory(category) : null;
    },

    getCategories: async () => {
      const categories = await prisma.category.findMany({
        include: { posts: true },
      });
      return categories.map(normalizeCategory);
    },

    getTag: async (_, { id }) => {
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: { posts: { include: { post: true } } },
      });
      return tag ? normalizeTag(tag) : null;
    },

    getTags: async () => {
      const tags = await prisma.tag.findMany({
        include: { posts: { include: { post: true } } },
      });
      return tags.map(normalizeTag);
    },

    getMessagesSent: async (_, { userId }) => {
      const messages = await prisma.message.findMany({
        where: { senderId: userId },
        include: { sender: true, receiver: true },
      });
      return messages.map(normalizeMessage);
    },

    getMessagesReceived: async (_, { userId }) => {
      const messages = await prisma.message.findMany({
        where: { receiverId: userId },
        include: { sender: true, receiver: true },
      });
      return messages.map(normalizeMessage);
    },

    getNotifications: async (_, { userId }) => {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: { user: true },
      });
      return notifications.map(normalizeNotification);
    },
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          gender: input.gender ?? null,
        },
        include: {
          posts: true,
          comments: true,
          likes: true,
          messagesSent: true,
          messagesReceived: true,
          notifications: true,
          profile: true,
        },
      });
      return normalizeUser(user);
    },

    createProfile: async (_, { input }) => {
      const profile = await prisma.profile.create({
        data: {
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          user: { connect: { id: input.userId } },
        },
        include: { user: true },
      });
      return normalizeProfile(profile);
    },

    createPost: async (_, { input }) => {
      try {
        const post = await prisma.post.create({
          data: {
            title: input.title,
            content: input.content,
            status: input.status ?? "DRAFT",
            author: { connect: { id: input.authorId } },
            ...(input.categoryId
              ? { category: { connect: { id: input.categoryId } } }
              : {}),
            ...(input.tags && input.tags.length > 0
              ? {
                  tags: {
                    create: input.tags.map((tagId: string) => ({
                      tag: { connect: { id: tagId } }, // Connect using join table
                    })),
                  },
                }
              : {}),
          },
          include: {
            author: true,
            category: true,
            tags: { include: { tag: true } }, // Ensure tags are loaded
          },
        });

        console.log("✅ Post created: ", post);

        return normalizePost(post);
      } catch (error) {
        console.error("❌ Error creating post: ", error);
        throw new Error("Failed to create post");
      }
    },

    createComment: async (_, { input }) => {
      const comment = await prisma.comment.create({
        data: {
          text: input.text,
          author: { connect: { id: input.authorId } },
          post: { connect: { id: input.postId } },
        },
        include: { author: true, post: true },
      });
      return normalizeComment(comment);
    },

    likePost: async (_, { input }) => {
      const like = await prisma.like.create({
        data: {
          user: { connect: { id: input.userId } },
          post: { connect: { id: input.postId } },
        },
        include: { user: true, post: true },
      });
      return normalizeLike(like);
    },

    sendMessage: async (_, { input }) => {
      const message = await prisma.message.create({
        data: {
          content: input.content,
          sender: { connect: { id: input.senderId } },
          receiver: { connect: { id: input.receiverId } },
        },
        include: { sender: true, receiver: true },
      });
      return normalizeMessage(message);
    },

    createCategory: async (_, { input }) => {
      const category = await prisma.category.create({
        data: {
          name: input.name,
          ...(input.postIds && input.postIds.length
            ? {
                posts: { connect: input.postIds.map((id: string) => ({ id })) },
              }
            : {}),
        },
        include: { posts: true },
      });
      return normalizeCategory(category);
    },

    createTag: async (_, { input }) => {
      // First, create the tag without any connections.
      const tag = await prisma.tag.create({
        data: {
          name: input.name,
        },
      });
      // If post IDs are provided, create join records manually.
      if (input.postIds && input.postIds.length > 0) {
        await Promise.all(
          input.postIds.map((postId: string) =>
            prisma.postTag.create({
              data: {
                postId,
                tagId: tag.id,
              },
            })
          )
        );
        // Reload the tag with its related posts.
        const tagWithPosts = await prisma.tag.findUnique({
          where: { id: tag.id },
          include: { posts: { include: { post: true } } },
        });
        return normalizeTag(tagWithPosts);
      }
      return normalizeTag(tag);
    },

    createNotification: async (_, { input }) => {
      const notification = await prisma.notification.create({
        data: {
          user: { connect: { id: input.userId } },
          type: input.type,
          message: input.message,
        },
        include: { user: true },
      });
      return normalizeNotification(notification);
    },
  },

  Post: {
    tags: (parent) => (parent.tags ?? []).map((postTag: any) => postTag),
  },

  Node: {
    __resolveType(obj) {
      if (obj.__typename) return obj.__typename;
      if ("email" in obj) return "User";
      if ("bio" in obj || "avatarUrl" in obj) return "Profile";
      if ("status" in obj && "title" in obj) return "Post";
      if ("text" in obj && "postId" in obj) return "Comment";
      if ("senderId" in obj && "receiverId" in obj) return "Message";
      if ("type" in obj && "createdAt" in obj) return "Notification";
      if ("name" in obj) {
        // Fallback heuristic: if posts exist, it's likely a Category; otherwise, a Tag.
        return obj.posts && Array.isArray(obj.posts) ? "Category" : "Tag";
      }
      return null;
    },
  },
};
