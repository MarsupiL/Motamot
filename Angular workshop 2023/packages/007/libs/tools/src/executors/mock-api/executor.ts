import { MockApiExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';

export default async function runExecutor(
  options: MockApiExecutorSchema,
  context: ExecutorContext
) {
  const location = `${context.root}/${context.workspace.projects[context.projectName].root}/src/mock-api/server.ts`
  require(location) // this will execute our mock server
  await new Promise(() => {})
}
