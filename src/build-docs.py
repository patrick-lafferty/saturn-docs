import clang.cindex
import sys
import json
from clang.cindex import *

def search(cursor):
    if "saturn" in cursor.location.file:
        print cursor.spelling

def is_saturn(node):
    return node.location.file is not None and "saturn" in node.location.file.name

class Constructor:

    def __init__(self, node):
        self.node = node       

    def show(self, indent):
        print " " * indent, self.node.spelling

def cleanComment(comment):
    return comment.replace('\r\n', '').replace('/*', '').replace('*/', '').replace('\'', '\\\'')

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
        
        params = ", ".join([x.type.spelling for x in self.parameters])
        signature = "{0} {1}({2})".format(self.node.result_type.spelling, self.name, params)

        template = "{{signature: '{0}', description: '{1}'}}"
        return template.format(signature, self.comment)

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

        template = "{{name: '{0}', classComment: '{1}', publicMethods: [{2}]}}"
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


class Namespace:

    def __init__(self, node):
        self.node = node
        self.classes = []
        self.functions = []
        self.structs = []
        self.namespaces = []
        self.nodes = []

        self.append(node)

    def append(self, node):

        for child in node.get_children():

            if child.kind == CursorKind.CLASS_DECL:
                self.classes.append(Class(child))
            elif child.kind == CursorKind.STRUCT_DECL:
                self.structs.append(Class(child, True))
            elif child.kind == CursorKind.NAMESPACE:
                self.namespaces.append(Namespace(child))
            elif child.kind == CursorKind.FUNCTION_DECL:
                self.functions.append(Method(child))
            else:
                print "unhandled child type ", child.kind
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

        if "saturn/src" in self.node.location.file.name:
            for x in self.classes:
                if not x.isEmpty():
                    classes.append(x.toJson())

            for x in self.functions:
                functions.append(x.toJson())

        for x in self.namespaces:
            x.collect(classes, functions)

toplevelNamespaces = {}

def recurse(node, indent = 0):

    if node.kind == CursorKind.NAMESPACE and "saturn/src" in node.location.file.name:

        if node.spelling in toplevelNamespaces:
            toplevelNamespaces[node.spelling].append(node)
        else:
            toplevelNamespaces[node.spelling] = (Namespace(node))
    #if is_saturn(node):
     #   print " " * indent, node.kind, " ", node.spelling
    else:

        for c in node.get_children():
            recurse(c, indent + 1)
    

index = clang.cindex.Index.create()
translationUnit = index.parse("../../saturn/src/services/apollo/lib/text.h",
    ['-x', 'c++', '-std=c++1z',
        '-I/home/pat/projects/saturn-libc++/include/c++/v1',
        '-fparse-all-comments'
    ])
    #sys.argv[1], ['-x', 'c++'])

for x in translationUnit.diagnostics:
    print x

recurse(translationUnit.cursor)
classes = []
functions = []

for name, ns in toplevelNamespaces.iteritems():
    ns.collect(classes, functions)

classesJson = ", ".join(classes)
functionsJson = ", ".join(functions)

print classesJson
print ""
print functionsJson

#toplevelNamespaces['Apollo'].show(0)