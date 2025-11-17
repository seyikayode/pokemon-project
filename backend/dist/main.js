"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const clientUrl = configService.get('CLIENT_URL');
    const port = configService.get('PORT') || 3001;
    app.enableCors({
        origin: clientUrl,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    await app.listen(port);
    console.log(`Backend running on port ${port}`);
}
;
bootstrap();
//# sourceMappingURL=main.js.map