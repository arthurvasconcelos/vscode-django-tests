> [!IMPORTANT]  
> As of August of 2024, VSCode _(version 1.93)_ got native support to find and run Django tests: [Django unit test support](https://code.visualstudio.com/updates/v1_93#_django-unit-test-support)

# VSCode Django Tests Provider

Django tests using VSCode's test explorer

## Sample Setup

```sh
pyenv virtualenv 3.12.2 vscode-django-tests

pyenv activate vscode-django-tests

cd sample

source ./env.sh

pip install
```

> [!NOTE]  
> This repo took inspiration from other test runner plugins, thank you for all those creators.
> 
> - https://github.com/Pachwenko/VSCode-Django-Test-Runner
> - https://github.com/panicofr/django-tester
> - https://github.com/jest-community/vscode-jest
> - https://github.com/microsoft/vscode-extension-samples/tree/main/test-provider-sample
