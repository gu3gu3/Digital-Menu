describe('Basic Test Suite', () => {
  it('should run basic tests without database connection', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  it('should test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret');
  });

  it('should test basic JavaScript functions', () => {
    const testArray = [1, 2, 3];
    expect(testArray).toHaveLength(3);
    expect(testArray).toContain(2);
    
    const testObject = { name: 'test', value: 42 };
    expect(testObject).toHaveProperty('name');
    expect(testObject.name).toBe('test');
  });
}); 