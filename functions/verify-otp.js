const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

app.http('verify-otp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email, code } = await request.json();
            
            const otpClient = TableClient.fromConnectionString(connectionString, "OtpCodes");
            
            try {
                // Дістаємо код з бази
                const entity = await otpClient.getEntity("OTP", email.toLowerCase());
                
                // Перевіряємо чи код співпадає і чи не вийшов час
                const now = new Date();
                const expiresAt = new Date(entity.expiresAt);

                if (entity.code !== code) {
                    return { status: 401, body: "Невірний код" };
                }
                if (now > expiresAt) {
                    return { status: 401, body: "Час дії коду вийшов" };
                }

                // Якщо все ОК - видаляємо використаний код з бази
                await otpClient.deleteEntity("OTP", email.toLowerCase());

                // ТУТ можна згенерувати і повернути JWT токен або сесійну куку
                return { 
                    status: 200, 
                    body: JSON.stringify({ success: true, message: "Успішний вхід" }),
                    headers: { 'Content-Type': 'application/json' }
                };

            } catch (error) {
                if (error.statusCode === 404) return { status: 401, body: "Код не запитувався" };
                throw error;
            }

        } catch (error) {
            context.error(error);
            return { status: 500, body: "Помилка сервера" };
        }
    }
});