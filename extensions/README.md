# Extensions

This directory contains explicit extension packages and adapters. Extensions must use documented interfaces and must not access application internals through undeclared paths.

当前实现包括 `example-catalog-query-detail-adapter-fixture/`：它通过显式 adapter-runtime contract 将本地注入式 wire fixture 转换为中性目录—查询—详情 canonical result，并保留无账户 mock session。它不执行真实 transport、backend discovery、credential、storage 或 UI 操作。

The current implementation includes `example-catalog-query-detail-adapter-fixture/`. Through the explicit adapter-runtime contract it converts local injected wire fixtures to neutral catalog-query-detail canonical results and retains the account-free mock session. It performs no real transport, backend discovery, credential, storage, or UI operation.
