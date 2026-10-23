export function AdultDeclaration() {
  return (
    <label className="adult-declaration">
      <input type="checkbox" name="adult_confirmation" value="yes" required />
      <span>I am 18 or older</span>
    </label>
  );
}
