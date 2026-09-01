"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transfer_service_1 = require("../src/services/transfer.service");
const db_1 = require("../src/db");
const jest_mock_extended_1 = require("jest-mock-extended");
const client_1 = require("@prisma/client");
const errors_1 = require("../src/utils/errors");
jest.mock('../src/db', () => ({
    __esModule: true,
    prisma: (0, jest_mock_extended_1.mockDeep)(),
}));
const prismaMock = db_1.prisma;
describe('TransferService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should throw BadRequestError if transferring to same account', async () => {
        await expect(transfer_service_1.TransferService.transferMoney('acc1', 'acc1', 100)).rejects.toThrow(errors_1.BadRequestError);
    });
    it('should throw BadRequestError if amount is less than or equal to zero', async () => {
        await expect(transfer_service_1.TransferService.transferMoney('acc1', 'acc2', 0)).rejects.toThrow(errors_1.BadRequestError);
        await expect(transfer_service_1.TransferService.transferMoney('acc1', 'acc2', -100)).rejects.toThrow(errors_1.BadRequestError);
    });
    // Prisma interactive transactions are complex to mock perfectly in jest-mock-extended.
    // Real world tests should hit a test database.
});
//# sourceMappingURL=transfer.service.test.js.map