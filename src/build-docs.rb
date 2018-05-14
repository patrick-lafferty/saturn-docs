#Dir.glob("*.{h,cpp}") { 
 #   |filename|

#    if File.file? filename
        filename = "text.h"
        lines = File.readlines filename

        puts filename

        lines.each_with_index {| line, index |
            case line
                #function definition
                when /\A\s*([[:alpha:]][[:graph:]]+)\s+([[:alpha:]][[:graph:]]+)\((.*)\)\s+{\s+$/
                    returnType, name, parameters = $1, $2, $3

                    #the above regex can also match if constexpr statements
                    if returnType != "if"
                        puts "found #{name} returns #{returnType} takes #{parameters}"

                        if lines[index - 1].match(/\*\/\s*$/)
                            prevIndex = index - 2

                            while !lines[prevIndex].match(/\s*\/\*/)
                                prevIndex -= 1
                            end

                            puts lines[prevIndex..index - 1]
                        end
                    end

                #function declaration
                when /\A\s*([[:alpha:]][[:graph:]]+)\s+([[:alpha:]][[:graph:]]+)\((.*)\)\s+;\s+$/
                    returnType, name, parameters = $1, $2, $3

                    puts "declare #{name}"

                #possible constructor with initiaizer list
                when /\A\s*([[:alpha:]][[:graph:]]+)\((.*)\)(\s+$|\s+{\s+$)/
                    name = $1

                    if lines[index].match(/{\s+$/)
                        puts "constructor #{$1}"
                    elsif lines[index + 1].match(/\A\s+:\s+[[:print:]]+\s+{\s+$/)
                        puts "constructor #{name} with initializer list"
                    end

                #class with no inheritance
                when /\As*(class|struct)\s*([[:alpha:]][[:graph:]]*)\s*{\s+$/
                    puts "#{$1} #{$2}"

                #class that inherits something
                when /\A\s*(class|struct)\s*([[:alpha:]][[:graph:]]*)\s*:\s*public\s*([[:alpha:]][[:graph:]]*)\s*{\s+$/
                    puts "#{$1} #{$2} inherits #{$3}"
            end
        }
#    end
#}