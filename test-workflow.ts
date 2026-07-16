import { db } from './lib/db';
import { executeWorkflow } from './app/actions/workflow-engine';

async function run() {
  const workflow = await db.workflow.findFirst();
  if (!workflow) {
    console.log('No workflows found');
    return;
  }
  console.log('Testing workflow:', workflow.id);
  const result = await executeWorkflow(workflow.id);
  console.log(result);
}
run();
