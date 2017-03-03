Vanillacrypto
=============

Manage your sensitive data with an easily auditable and portable html page.

Don't trust me, fork this project, review the main file (or ask a trusted 
developer to do it for you) and use that file instead.

It's small, you can review it in a few minutes.

You can either use it from a local copy or from a version that you stored
in a trusted place (e.g. github pages on your own account).

Obviously you don't need to fork the project: just download the main file,
it's a simple html page, without external dependencies.

Goals
=====

- have a single, portable file that you can run either locally or from a 
trusted server
- the file must be usable as is, whithout the need of compilers
- the file must not have external dependencies
- the file must be easily auditable, in minutes (at least after the first
review)
- must run at least in current Firefox and Chrome
- the only external communications accepted are the one needed to retrieve
or store encrypted data to an online storage

Non goals
=========
- write the smallest possible file sacrificing documentation or readability

Undecided goals
===============
- store files
- give the ability to upload to more than one location. It must not increase 
the size of the resulting file too much. Maybe I'll build different files to
use one or more choosen storages, but the distributed file must respect the
goals.