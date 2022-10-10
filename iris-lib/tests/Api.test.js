import iris from '../cjs';

/* Iris API provides a singleton instance of the Iris class. */
describe('iris API', () => {
  it('should have iris.local() for local state', () => {
    expect(typeof iris.local).toBe('function');
  });

  it('should have iris.user() for spaces that only the user can write to', () => {
    expect(typeof iris.user).toBe('function');
  });

  it('should have iris.private() for spaces that only the user can read and write to', () => {
    expect(typeof iris.private).toBe('function');
  });

  it('should have iris.group() for group aggregate spaces', () => {
    expect(typeof iris.group).toBe('function');
  });

  it('should have iris.static for content-addressed static data', () => {
    expect(typeof iris.static).toBe('object');
  });

  it('should have iris.algorithms', () => {
    expect(iris.algorithms).toBeDefined();
  });
});