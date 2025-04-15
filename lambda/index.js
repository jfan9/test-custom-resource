// lambda/index.ts
const handler = async (event, context) => {
    const response = {
        PhysicalResourceId: event.LogicalResourceId,
        Status: 'SUCCESS',
        Data: {
            Result: ''
        }
    };

    switch (event.RequestType) {
        case "Create":
            response.Data.Result = 'CreateTest';
            break;
        case "Update":
            response.Data.Result = 'UpdateTest';
            break;
        case "Delete":
            response.Data.Result = 'DeleteTest';
            break;
        default:
            response.Data.Result = 'FailTest';
    }

    return response;
};

exports.handler = handler;
