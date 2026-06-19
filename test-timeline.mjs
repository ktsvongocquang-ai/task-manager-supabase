import handler from './api/generate-timeline.js';

const mockReq = {
    method: 'POST',
    body: {
        area: 100,
        projectType: 'Chung cư'
    }
};

const mockRes = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        console.log('Status:', this.statusCode);
        console.log('Data:', data);
    }
};

(async () => {
    try {
        await handler(mockReq, mockRes);
    } catch (e) {
        console.error(e);
    }
})();
