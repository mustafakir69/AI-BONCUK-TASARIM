import os

import pytest


@pytest.mark.skipif(
    os.getenv("RUN_OPENAI_INTEGRATION_TESTS") != "1" or not os.getenv("OPENAI_API_KEY"),
    reason="Gerçek ücretli OpenAI testi yalnız açık opt-in ve anahtarla çalışır.",
)
def test_real_openai_integration_is_explicitly_opt_in() -> None:
    pytest.skip("Bu depo doğrulamasında ücretli API çağrısı bilinçli olarak çalıştırılmadı.")
