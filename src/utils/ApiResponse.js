class ApiResponse{
    constructor(stattusCode, data, message = "success") {
        this.statusCode = stattusCode;
        this.message = message;
        this.data = data;
        this.success = stattusCode < 400;
    }
}
export {ApiResponse};