import handler from './api/generate-project.js';

const mockReq = {
    method: 'POST',
    body: {
        projectName: 'Thiết kế Nội thất Penthouse',
        clientName: 'Chị Hà VIP',
        startDate: '2026-03-02',
        leadName: 'Dao Quoc Hung',
        supportName: 'Tuan Hung',
        projectType: 'Chung cư cao cấp',
        style: 'Luxury',
        investment: 'Siêu cao cấp (> 5 Tỷ)',
        area: '250'
    }
};

const mockRes = {
    statusCode: 200,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log(`\n=== API RESPONSE (Status: ${this.statusCode}) ===\n`);
        console.log(JSON.stringify(data, null, 2));
        console.log('\n=== END RESPONSE ===\n');
    }
};

async function testGeneration() {
    console.log("Calling /api/generate-project...");
    console.log("Input Payload:", mockReq.body);
    await handler(mockReq, mockRes);
}

testGeneration();
