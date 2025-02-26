I have ask Chatgpt how to create the project that client requires Below is chatgpt is answer and i follow that and create a project.

First i have connected on postgres database with below url in my system and put .env 
DATABASE_URL="postgresql://postgres:admin555@localhost:5432/prisma-api-client-db"

you should also create a local database on your system and then build the above url.

then npm install and then npm run dev the project will run

Below is a comprehensive, step‐by‐step walkthrough for setting up a dedicated GraphQL generator workflow that meets your client’s requirements. In this approach, we’ll:

1. Define a complex GraphQL schema (as an example)  
2. Generate TypeScript types (including resolver signatures) using GraphQL Code Generator  
3. Map GraphQL types to database tables (using an ORM or migration tool)  
4. Implement resolvers that conform to the signatures expected by @graphql-tools  

---

## 1. Define a Complex GraphQL Schema

Let’s consider the following sample schema that contains interfaces, enums, unions, input types, and relations. Save this into a file (e.g., `schema.graphql`):

```graphql
schema {
  query: Query
  mutation: Mutation
}

# An interface to mark common fields
interface Node {
  id: ID!
}

# Enums for fixed value sets
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# Types and relationships
type User implements Node {
  id: ID!
  name: String!
  email: String!
  gender: Gender
  profile: Profile
  posts: [Post!]!
}

type Profile implements Node {
  id: ID!
  bio: String
  avatarUrl: String
  user: User!
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  status: PostStatus!
  author: User!
  comments: [Comment!]!
}

type Comment implements Node {
  id: ID!
  text: String!
  author: User!
  post: Post!
}

# Union to return heterogeneous search results
union SearchResult = User | Post | Comment

# Input types for mutations
input CreateUserInput {
  name: String!
  email: String!
  gender: Gender
}

input CreatePostInput {
  title: String!
  content: String!
  authorId: ID!
}

input CreateCommentInput {
  text: String!
  authorId: ID!
  postId: ID!
}

# Root Query
type Query {
  node(id: ID!): Node
  search(text: String!): [SearchResult!]!
  getUser(id: ID!): User
  getPost(id: ID!): Post
}

# Root Mutation
type Mutation {
  createUser(input: CreateUserInput!): User!
  createPost(input: CreatePostInput!): Post!
  createComment(input: CreateCommentInput!): Comment!
}
```

This schema is “complicated” enough to include various GraphQL constructs, which you can extend further based on your project needs.

---

## 2. Set Up the Environment & Generate TypeScript Types

### A. Project Setup

1. **Initialize your Node.js project** (if not already done):
   ```bash
   mkdir graphql-project
   cd graphql-project
   npm init -y
   ```

2. **Install required dependencies:**
   ```bash
   npm install graphql @graphql-tools/schema
   npm install --save-dev typescript ts-node @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
   ```

3. **Initialize TypeScript configuration:**
   ```bash
   npx tsc --init
   ```
   Adjust `tsconfig.json` as needed for your project.

### B. GraphQL Code Generator Configuration

1. **Create a configuration file (`codegen.yml`):**

   ```yaml
   schema: "./schema.graphql"
   generates:
     ./src/generated/graphql.ts:
       plugins:
         - "typescript"
         - "typescript-resolvers"
   ```

2. **Run the Code Generator:**
   ```bash
   npx graphql-codegen --config codegen.yml
   ```

This command reads your schema and generates a TypeScript file (e.g., `./src/generated/graphql.ts`) containing:
- **TypeScript type definitions** for all schema types (interfaces, enums, input types, etc.)  
- **Resolver signatures** that match the expectations of libraries like @graphql-tools

---

## 3. Map GraphQL Types to Database Tables

GraphQL itself doesn’t create tables in your database, so you must use an ORM or a migration tool. Here’s one way to do it:

### A. Choose an ORM or Migration Tool

- **Prisma:** Even though you won’t reuse your custom Prisma generator, you can still use Prisma’s migration capabilities by defining a Prisma schema that mirrors your GraphQL types.
- **TypeORM or Sequelize:** Alternatively, you can map each GraphQL type to a corresponding database entity manually.

### B. Example Mapping Strategy (Using Prisma as an Example)

1. **Create a Prisma schema (`prisma/schema.prisma`)** that mirrors your GraphQL types:

   ```prisma
   datasource db {
     provider = "postgresql" // or your chosen provider
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
     output   = "./node_modules/@prisma/client"
   }

   model User {
     id      String   @id @default(uuid())
     name    String
     email   String   @unique
     gender  Gender?
     profile Profile?
     posts   Post[]
   }

   model Profile {
     id        String @id @default(uuid())
     bio       String?
     avatarUrl String?
     userId    String @unique
     user      User   @relation(fields: [userId], references: [id])
   }

   model Post {
     id       String   @id @default(uuid())
     title    String
     content  String
     status   PostStatus
     authorId String
     author   User     @relation(fields: [authorId], references: [id])
     comments Comment[]
   }

   model Comment {
     id       String @id @default(uuid())
     text     String
     authorId String
     postId   String
     author   User   @relation(fields: [authorId], references: [id])
     post     Post   @relation(fields: [postId], references: [id])
   }

   enum Gender {
     MALE
     FEMALE
     OTHER
   }

   enum PostStatus {
     DRAFT
     PUBLISHED
     ARCHIVED
   }
   ```

2. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

This creates database tables corresponding to your GraphQL types. If you’re not using Prisma, the same principle applies—create tables that mirror the GraphQL type definitions and their relations.

---

## 4. Implement Resolvers with Type-Safe Signatures

### A. Creating Your Resolvers

With the generated TypeScript types in hand, you can now write resolvers that exactly conform to the generated resolver signatures.

Create a resolver file (e.g., `src/resolvers.ts`):

```typescript
import { Resolvers } from './generated/graphql';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resolvers: Resolvers = {
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
      if ('email' in obj) return 'User';
      if ('title' in obj) return 'Post';
      if ('text' in obj) return 'Comment';
      return null;
    },
  },
};

export default resolvers;
```

### B. Creating the Executable Schema

Using @graphql-tools, combine your type definitions and resolvers to create an executable schema. For example, with Apollo Server:

```typescript
import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import fs from 'fs';
import resolvers from './resolvers';

// Load the schema from file
const typeDefs = fs.readFileSync('./schema.graphql', 'utf-8');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({ schema });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
```

The generated TypeScript definitions ensure that every resolver’s parameters and return types match the expectations—making your code safer and easier to maintain.

---

## 5. Putting It All Together & Next Steps

### A. Workflow Recap

1. **Define Your GraphQL Schema:**  
   Create a schema file (with interfaces, enums, unions, input types, etc.) that captures your data model and operations.

2. **Generate TypeScript Types:**  
   Use GraphQL Code Generator to produce both the type definitions and the resolver signatures based on your schema.

3. **Map to Database Tables:**  
   Use an ORM (like Prisma) to mirror your GraphQL types into database tables. Run migrations to create these tables.

4. **Implement Resolvers:**  
   Write resolvers that strictly follow the generated TypeScript signatures. This ensures type safety and compatibility with @graphql-tools.

5. **Build the Executable Schema:**  
   Combine your SDL (schema file) and resolvers using tools like `makeExecutableSchema` to create the GraphQL API.

6. **Testing & Integration:**  
   Run the server, test your endpoints, and integrate type-checking in your CI/CD pipeline to catch any discrepancies early.

### B. Automation & Maintenance

- **Auto-Regeneration:**  
  Add a script or watcher (using tools like `nodemon`) to automatically run `graphql-codegen` when your schema changes.

- **CI/CD Integration:**  
  Include steps in your pipeline to generate types and run type-checks to maintain consistency between your schema and implementation.

- **Documentation:**  
  Document the mapping between your GraphQL schema and database tables, as well as how to add or modify resolvers, to help your team and future maintenance.

---

This approach provides you with a dedicated GraphQL generator workflow that cleanly separates the concerns:
- **Schema Definition & Type Generation:** Handled by your GraphQL schema and codegen configuration.
- **Database Table Creation:** Driven by your ORM’s schema (which can be maintained separately but mapped one-to-one with your GraphQL types).
- **Resolver Implementation:** Enforced by auto-generated TypeScript signatures and integrated via @graphql-tools.

Following these steps will give you a robust, type-safe GraphQL API that adheres to your client’s specifications without relying on your previous custom Prisma generator.