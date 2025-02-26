const { ApolloServer } = require("apollo-server");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const fs = require("fs");
const { resolvers } = require("./resolvers");

// Load the schema from file
const typeDefs = fs.readFileSync("./schema.graphql", "utf-8");

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({ schema });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
