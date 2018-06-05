"""
Copyright (c) 2018, Patrick Lafferty
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the copyright holder nor the names of its 
      contributors may be used to endorse or promote products derived from 
      this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR 
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

import clang.cindex
import sys
import os
from clang.cindex import *

class Constructor:

    def __init__(self, node):
        self.node = node       

    def show(self, indent):
        print " " * indent, self.node.spelling

def cleanComment(comment):
    return comment.replace('\r\n', '').replace('/*', '').replace('*/', '').replace('\'', '\\\'')

def stripQualifiers(name):
    if name.endswith(" *") or name.endswith(" &"):
        name = name[0:-2]

    if name.startswith("const "):
        name = name[6:]

    return name

class Method:

    def __init__(self, node):
        self.name = node.spelling
        self.parameters = []
        self.returnType = None
        self.returnQualifiers = []
        self.node = node
        self.comment = cleanComment(node.raw_comment) if node.raw_comment else ""

        qualifiers = []

        for child in node.get_children():
            if child.kind == CursorKind.TYPE_REF:
                self.returnType = child
                self.returnQualifiers = qualifiers
                qualifiers = []
            elif child.kind == CursorKind.PARM_DECL:
                self.parameters.append(child)
                #TODO: param qualifiers?
            elif child.kind == CursorKind.NAMESPACE_REF:
                qualifiers.append(child)
            elif child.kind == CursorKind.TEMPLATE_REF:
                qualifiers.append(child)
            else:
                pass
                #KEEP
                #print "unhandled method child", child.kind, child.spelling, node.spelling

    def toJson(self):
        
        params = [x.type.spelling for x in self.parameters]
        paramTemplate = "{{link: '{0}', type: '{1}'}}"
        parameters = []

        for x in params:
            unqualifiedName = stripQualifiers(x)            
            link = fullyQualifiedLocations[unqualifiedName] if unqualifiedName in fullyQualifiedLocations else ""
            parameters.append(paramTemplate.format(link, x))
        
        returnTypeName = stripQualifiers(self.node.result_type.spelling)
        returnLink = fullyQualifiedLocations[returnTypeName] if returnTypeName in fullyQualifiedLocations else ""

        template = "{{name: '{0}',\n signature: [{1}],\nreturn: {2},\n description: '{3}'}}"
        return template.format(self.name, ", ".join(parameters), paramTemplate.format(returnLink, self.node.result_type.spelling), self.comment)

    def show(self, indent):

        returnType = self.node.result_type.spelling

        print "{0} {1} {2} ".format(" " * indent, 
            returnType, self.name
        )

class Class:

    def __init__(self, node, isStruct = False):

        self.name = node.spelling
        self.constructors = []
        self.publicMethods = []
        self.protectedMethods = []
        self.privateMethods = []
        self.isStruct = isStruct
        self.publicFields = {}
        self.protectedFields = {}
        self.privateFields = {}
        self.comment = cleanComment(node.raw_comment) if node.raw_comment else ""
        self.filename = node.location.file.name

        currentAccess = clang.cindex.AccessSpecifier.PUBLIC if isStruct else clang.cindex.AccessSpecifier.PRIVATE

        for child in node.get_children():
            if child.kind == CursorKind.CONSTRUCTOR:
                self.constructors.append(Constructor(child))
            elif child.kind == CursorKind.CXX_METHOD:
                if currentAccess == clang.cindex.AccessSpecifier.PUBLIC:
                    self.publicMethods.append(Method(child))
                elif currentAccess == clang.cindex.AccessSpecifier.PROTECTED:
                    self.protectedMethods.append(Method(child))
                else:
                    self.privateMethods.append(Method(child))
            elif child.kind == CursorKind.FIELD_DECL:
                if currentAccess == clang.cindex.AccessSpecifier.PUBLIC:
                    self.publicFields[child.spelling] = child.type.spelling
                elif currentAccess == clang.cindex.AccessSpecifier.PROTECTED:
                    self.protectedFields[child.spelling] = child.type.spelling
                else:
                    self.privateFields[child.spelling] = child.type.spelling
            elif child.kind == CursorKind.CXX_ACCESS_SPEC_DECL:
                currentAccess = child.access_specifier

            elif child.kind == CursorKind.FUNCTION_TEMPLATE:
                if currentAccess == clang.cindex.AccessSpecifier.PUBLIC:
                    self.publicMethods.append(Method(child))
                elif currentAccess == clang.cindex.AccessSpecifier.PROTECTED:
                    self.protectedMethods.append(Method(child))
                else:
                    self.privateMethods.append(Method(child))
            else:
                pass
                #KEEP THIS
                #print "unhandled class child ", child.kind, child.spelling, node.spelling

    def isEmpty(self):
        return not (self.constructors or self.publicMethods or self.publicFields)

    def toJson(self):

        publicMethodJsons = []

        for x in self.publicMethods:
            publicMethodJsons.append(x.toJson())

        template = "{{name: '{0}',\n classComment: '{1}',\n publicMethods: [{2}]}}"
        return template.format(self.name, self.comment, ", ".join(publicMethodJsons))

    def show(self, indent):

        print " " * indent, "struct" if self.isStruct else "class ", self.name

        for constructor in self.constructors:
            constructor.show(indent + 1)

        if self.publicMethods or self.publicFields:
            print " " * (indent + 1) + "public:"
            for method in self.publicMethods:
                method.show(indent + 2)

            for name, type in self.publicFields.iteritems():
                print "{0} {1}: {1}".format(" " * (indent + 2), name, type)

        if self.privateMethods or self.privateFields:

            print " " * (indent + 1) + "private:"
            for method in self.privateMethods:
                method.show(indent + 2)

            for name, type in self.privateFields.iteritems():
                print "{0} {1}: {1}".format(" " * (indent + 2), name, type)

        if self.protectedMethods or self.protectedFields:
            print " " * (indent + 1) + "protected:"
            for method in self.protectedMethods:
                method.show(indent + 2)

            for name, type in self.protectedFields.iteritems():
                print "{0} {1}: {1}".format(" " * (indent + 2), name, type)

fullyQualifiedLocations = {}
rootLength = len("/home/pat/projects/saturn/src")

def addClassLocation(parentName, path, location):

    if "Memory::VirtualMemoryManager" in path:
        print "VMM ", location

    if parentName:
        path = parentName + "::" + path

    relativeLocation = location[rootLength:]

    fullyQualifiedLocations[path] = relativeLocation

class Namespace:

    def __init__(self, node, file, parentName = ""):
        self.node = node
        self.classes = []
        self.functions = []
        self.structs = []
        self.namespaces = []
        self.nodes = []
        self.parentName = parentName
        self.mainFile = file

        self.append(node, file)

    def append(self, node, mainFile):

        for child in node.get_children():

            if child.location.file.name != mainFile:
                continue

            if child.kind == CursorKind.CLASS_DECL and child.is_definition():
                self.classes.append(Class(child))
                addClassLocation(self.parentName, node.spelling + "::" + child.spelling, mainFile)

            elif child.kind == CursorKind.CLASS_TEMPLATE:
                self.classes.append(Class(child))
                addClassLocation(self.parentName, node.spelling + "::" + child.spelling, mainFile)

            elif child.kind == CursorKind.STRUCT_DECL and child.is_definition():
                self.structs.append(Class(child, True))
                addClassLocation(self.parentName, node.spelling + "::" + child.spelling, mainFile)

            elif child.kind == CursorKind.NAMESPACE:
                self.namespaces.append(Namespace(child, mainFile, node.spelling))
            elif child.kind == CursorKind.FUNCTION_DECL:
                self.functions.append(Method(child))
            elif child.kind == CursorKind.CXX_METHOD:
                self.functions.append(Method(child))
            elif child.kind == CursorKind.FUNCTION_TEMPLATE:
                self.functions.append(Method(child))
            else:
                print "unhandled child type ", child.kind, child.spelling
                pass


    def show(self, indent):
        print " " * indent, "namespace ", self.node.spelling

        for child in self.classes:
            child.show(indent + 1)

        for child in self.structs:
            child.show(indent + 1)

        for child in self.namespaces:
            child.show(indent + 1)

    def showNodes(self, indent):
        for node in self.nodes:
            print " " * indent, node.spelling

    def collect(self, classes, functions):

        if "saturn/src" in self.mainFile:
            for x in self.classes:
                if not x.isEmpty():
                    classes.append(x.toJson())

            for x in self.structs:
                if not x.isEmpty():
                    classes.append(x.toJson())

            for x in self.functions:
                functions.append(x.toJson())

        for x in self.namespaces:
            x.collect(classes, functions)

def recurse(toplevelNamespaces, node, mainFile, indent = 0):

    if node.kind == CursorKind.NAMESPACE and "saturn/src" in node.location.file.name:

        if node.spelling in toplevelNamespaces:
            toplevelNamespaces[node.spelling].append(node, mainFile)
        else:
            toplevelNamespaces[node.spelling] = (Namespace(node, mainFile))

    elif "libc" in mainFile:

        nsName = mainFile[mainFile.rfind("/") + 1:]

        for child in node.get_children():
            if child.kind == CursorKind.UNEXPOSED_DECL:

                if nsName in toplevelNamespaces:
                    toplevelNamespaces[nsName].append(child, mainFile)
                else:
                    toplevelNamespaces[nsName] = Namespace(child, mainFile)

    else:

        for c in node.get_children():
            recurse(toplevelNamespaces, c, mainFile, indent + 1)
    
def createFileJson(name, toplevelNamespaces): 

    classes = []
    functions = []

    for nsname, ns in toplevelNamespaces.iteritems():
        ns.collect(classes, functions)

    contentsTemplate = "{{classes: [{0}], freeFunctions: [{1}]}}"
    contents = contentsTemplate.format(", ".join(classes), ", ".join(functions))

    template = "\n{{type: 'file',\n classType: 'fileType',\n name: '{0}',\n contents: {1}}}"
    return template.format(name, contents)

def parseFile(filename, fullpath):

    index = clang.cindex.Index.create()
    translationUnit = index.parse(fullpath,
        ['-x', 'c++', '-std=c++1z',
            '-I/home/pat/projects/saturn-libc++/include/c++/v1',
            '-I/home/pat/projects/saturn/src',
            '-Drestrict=__restrict',
            '-fparse-all-comments'
        ])

    for x in translationUnit.diagnostics:
        print x

    toplevelNamespaces = {}

    recurse(toplevelNamespaces, translationUnit.cursor, fullpath)
    classes = []
    functions = []

    return [filename, toplevelNamespaces]

def parseDirectory(name, directory):

    fileJsons = []
    parsedFiles = []
    directories = []

    for root, subdirs, files in os.walk(directory):

        for dir in subdirs:
            if dir == "applications" or dir == "userland" or dir == "freestanding" or dir == "hosted":
                continue

            subdir = parseDirectory(dir, os.path.join(root, dir))
            directories.append(subdir)

        for file in files:
            if file.endswith(".h"):    
                parsedFiles.append(parseFile(file, os.path.join(root, file)))

        break

    return [name, directories, parsedFiles]

def jsonifyDirectory(directory):
    fileJsons = []
    parsedFiles = directory[2]
    directories = directory[1]
    directoryJsons = []
    name = directory[0]

    for dir in directories:
        subdir = jsonifyDirectory(dir)
        directoryJsons.append(subdir)

    for file in parsedFiles:
        json = createFileJson(file[0], file[1])
        fileJsons.append(json)

    template = "{{type: 'dir',\n classType: 'dirType',\n name: '{0}',\n contents: [{1}]}}"
    return template.format(name, ", ".join(directoryJsons + fileJsons))

parsedDirs = parseDirectory("", "/home/pat/projects/saturn/src")
result = jsonifyDirectory(parsedDirs)

with open('documentation.js', 'w') as output:
    template = "let topLevel = {0};"

    output.write(template.format(result))
    output.write("export default topLevel")