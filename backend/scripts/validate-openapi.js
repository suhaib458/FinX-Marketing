import SwaggerParser from '@apidevtools/swagger-parser';

await SwaggerParser.validate('openapi.yaml');
process.stdout.write('OpenAPI document is valid.\n');
