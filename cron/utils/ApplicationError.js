class ApplicationError extends Error {
  constructor(message, additionalInfos) {
    super(message);
    this.name = this.constructor.name;
    this.additionalInfos = additionalInfos;
  }
}

export default ApplicationError;
