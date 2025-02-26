const { Resolvers } = require("./generated/graphql");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

export const resolvers: typeof Resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      return prisma.user.findUnique({ where: { id } });
    },
    getPost: async (_, { id }) => {
      return prisma.post.findUnique({ where: { id } });
    },
    search: async (_, { text }) => {
      // Combine search results from various models as needed
      const users = await prisma.user.findMany({
        where: { name: { contains: text } },
      });
      const posts = await prisma.post.findMany({
        where: { title: { contains: text } },
      });
      // For simplicity, we return an array combining users and posts
      return [...users, ...posts];
    },
    node: async (_, { id }) => {
      // Implement a node lookup based on id
      // You could have a more sophisticated type resolution here
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) return user;
      const post = await prisma.post.findUnique({ where: { id } });
      if (post) return post;
      return null;
    },
  },
  Mutation: {
    createUser: async (_, { input }) => {
      return prisma.user.create({ data: input });
    },
    createPost: async (_, { input }) => {
      return prisma.post.create({ data: input });
    },
    createComment: async (_, { input }) => {
      return prisma.comment.create({ data: input });
    },
  },
  // If needed, add resolvers for union types or field-level resolvers
  SearchResult: {
    __resolveType(obj, context, info) {
      if ("email" in obj) return "User";
      if ("title" in obj) return "Post";
      if ("text" in obj) return "Comment";
      return null;
    },
  },
};
