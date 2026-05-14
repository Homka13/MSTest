const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const sgMail = require('@sendgrid/mail');

// Налаштування (ключі будуть братися з налаштувань Azure)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

app.http('request-otp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email } = await request.json();
            if (!email) return { status: 400, body: "Email обов'язковий" };

            // 1. ПЕРЕВІРКА ТРЕНЕРА: Чи є він у нашій базі?
            const trainersClient = TableClient.fromConnectionString(connectionString, "Trainers");
            try {
                // Шукаємо тренера. PartitionKey="Trainer", RowKey=email
                await trainersClient.getEntity("Trainer", email.toLowerCase());
            } catch (error) {
                if (error.statusCode === 404) {
                    return { status: 403, body: "Доступ заборонено. Email не знайдено в базі тренерів." };
                }
                throw error;
            }

            // 2. ГЕНЕРАЦІЯ КОДУ
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 цифр
            const expiresAt = new Date(Date.now() + 5 * 60000); // Код діє 5 хвилин

            // 3. ЗБЕРЕЖЕННЯ КОДУ В БАЗУ
            const otpClient = TableClient.fromConnectionString(connectionString, "OtpCodes");
            await otpClient.upsertEntity({
                partitionKey: "OTP",
                rowKey: email.toLowerCase(),
                code: otpCode,
                expiresAt: expiresAt.toISOString()
            });

            // 4. ВІДПРАВКА EMAIL ЧЕРЕЗ SENDGRID
            const msg = {
                to: email,
                from: 'noreply@yourdomain.com', // Твій підтверджений email в SendGrid
                subject: 'Твій код доступу до BROCARD Portal',
                text: `Твій одноразовий код: ${otpCode}. Він діє 5 хвилин.`,
                html: `<strong>Твій одноразовий код: ${otpCode}</strong>. Він діє 5 хвилин.`,
            };
            await sgMail.send(msg);

            return { status: 200, body: "Код успішно відправлено" };

        } catch (error) {
            context.error(error);
            return { status: 500, body: "Помилка сервера" };
        }
    }
});