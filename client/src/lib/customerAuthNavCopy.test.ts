import { describe, expect, it } from "vitest";
import { commerceCopy } from "./commerceCopy";
import { publicCopy } from "./publicCopy";

describe("public customer authentication navigation copy", () => {
  it("provides a distinct localized customer sign-in label in every supported language", () => {
    expect(commerceCopy.en.shell.customerSignIn).toBe("Customer sign in");
    expect(commerceCopy.fr.shell.customerSignIn).toBe("Connexion client");
    expect(commerceCopy.ar.shell.customerSignIn).toBe("دخول العميل");
  });

  it("keeps the landing-page sign-in entry localized in every supported language", () => {
    expect(publicCopy.en.nav.signIn).toBe("Customer sign in");
    expect(publicCopy.fr.nav.signIn).toBe("Connexion client");
    expect(publicCopy.ar.nav.signIn).toBe("دخول العميل");
  });
});
