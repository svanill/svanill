Vanillacrypto
=============

Manage your sensitive data with an easily auditable and portable html page.

Don't trust me, fork this project, review the main file (or ask a trusted
developer to do it for you) and use that file instead.

It's small, you can review it.

You can either use it from a local copy or from a version that you stored
in a trusted place (e.g. github pages on your own account).

Obviously you don't need to fork the project: just download the main file,
it's a simple html page, without external dependencies.

Goals
=====

- have the means to manage secrets
- have a single-file application that can run locally
- it must be portable (Linux, Windows, Android, OS X, others)
- the file must be usable as-is (no compilers or installers) (it's acceptable to require a not-too-old browser)
- the file must not have external dependencies
- the source code must be easily auditable by a single developer or be audited by a third party (but then you should use the audited version)
- the only external communications accepted are the one needed to retrieve/store encrypted data from/to a storage service

Non goals
=========
- write the smallest possible file sacrificing documentation or readability

Undecided goals
===============
- store binary files
- give the ability to upload to more than one location. It must not increase
the size of the application too much. Maybe I'll build different files to
use one or more choosen storages, but the distributed file must respect the
goals.

F.A.Q.
======

# How is contrent encrypted?

Content is encrypted using AES-GCM. The size of the iv (a nonce) is 96 bit. The iv is a random sequence created through [window.crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues) (its PRNG is suitable for cryptographic usages).
The key is derived with PBKDF2, using SHA-256 as hash, 60.000 iterations (default, editable). The salt is up to the user (is suggested to be at least 8 characters long).
Salt and iteratioSQLCipherns are not expected to be kept secret, they are part of the additional data of the produced ciphertext.

# Why not Enpass

Enpass is the best of the bunch. Standalone support, truly comprehensive cross-platform versions, stores the data using SQLCipher (which is open source) so you

# What's wrong with Lastpass / 1Password?

They are not open source and Linux is not a first class citizen.

# What's wrong with Keypass

Too big to audit for a solo developer. Keypass 1.x was audited, but Keypass 2.x was not and, cit. keypass.info, "They are fundamentally different". No official/audited Android application.
Yet it's respected and full featured if that's what you're searching for.

# What's wrong with pass

Requires to keep around a gpg private key. No official/audited Android application.

License
=======

Vanillacrypto, a tool to encrypt/decrypt sensitive data.
Copyright (C) 2017 Riccardo Attilio Galli

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
