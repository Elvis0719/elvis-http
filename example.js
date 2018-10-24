const server = require('./index')

const config = {
  clientId: '1994',
  http: { port: 3094 }
}

const restful = (logger, router) => {
  router.route('/test')
  .get((req, res, next) => {
    throw new Error('456')
    res.send('OK')
  })
}

const {
  GraphQLSchema, GraphQLObjectType, GraphQLString
} = require('graphql')
const graphql = {
  schema: new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQLString,
          args: {
            text: { type: GraphQLString }
          },
          resolve (root, args, ast) {
            return args.text ? args.text : 'world'
          }
        }
      }
    })
  })
}

server(config, { restful, graphql })
