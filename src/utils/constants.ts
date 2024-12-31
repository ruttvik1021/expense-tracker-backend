export const jwtConstants = {
  secret: process.env.jwtSecret!,
  expiresIn: process.env.jwtExpiresIn!,
};

export const authenticationConstants = {
  errors: {
    missingAuthHeaders: 'Unauthorized - Missing Authorization Header',
    invalidAuthHeaderFormat:
      'Unauthorized - Invalid Authorization Header Format',
    invalidCredentials: 'Invalid Credentials',
    userExists: 'User already exists',
  },
};

export const userMessages = {
  errors: {
    userNotFound: 'User not found',
    invalidPassword: 'Invalid password',
  },
  messages: {
    userCreated: 'User created successfully',
    passwordUpdated: 'Password updated successfully',
  },
};

export const categoryMessages = {
  errors: {
    categoryNotFound: 'Category not found',
  },
  messages: {
    categoryCreated: 'Category created successfully',
    categoriesCreated: 'Categories created successfully',
    categoryDeleted: 'Category deleted successfully',
    categoryUpdated: 'Category updated successfully',
  },
};

export const commonMessages = {
  errors: {
    notValidId: 'Invalid ID',
  },
};

export const transactionMessages = {
  errors: {
    transactionNotFound: 'Transaction not found',
  },
  messages: {
    transactionCreated: 'Transaction created successfully',
    transactionsCreated: 'Transactions created successfully',
    transactionDeleted: 'Transaction deleted successfully',
    transactionUpdated: 'Transaction updated successfully',
  },
};

export const sourceMessages = {
  errors: {
    sourceNotFound: 'Source not found',
    sourceAlreadyExists: 'Source already exists',
  },
  messages: {
    sourceCreated: 'Source created successfully',
    sourceDeleted: 'Source deleted successfully',
    sourceUpdated: 'Source updated successfully',
  },
};

export const emailMessages = {
  errors: {
    invalidToken: 'Invalid token',
  },
  messages: {
    verificationEmailSent: 'Verification email sent',
    emailVerified: 'Email verified successfully',
  },
};
